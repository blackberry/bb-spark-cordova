/*
 * Copyright (c) 2018 BlackBerry. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "BBMEnterprise.framework/Headers/BBMEnterpriseService.h"
#import "BBMEnterprise.framework/Headers/BBMMessages.h"
#import "BBMEnterprise.framework/Headers/BBMIncomingMessage.h"
#import "BBMEnterprise.framework/Headers/BBMIncomingMessages.h"
#import "BBMEnterprise.framework/Headers/BBMLiveList.h"
#import "BBMEnterprise.framework/Headers/BBMChat.h"
#import "BBMEnterprise.framework/Headers/BBMJSONMessage.h"
#import "BBMEnterprise.framework/Headers/BBMDSGeneratedModel.h"
#import "BBMEnterprise.framework/Headers/ObservableMonitor.h"
#import "BBMEnterprise.framework/Headers/ObservableMonitorSet.h"
#import <Cordova/CDVPlugin.h>
#import <Foundation/Foundation.h>
#import <TargetConditionals.h>

#if TARGET_OS_IPHONE
#import <PushKit/PushKit.h>
#import "BBMMediaCallManager.h"
#import "BBMAppUser.h"
#import "BBMUIUtilities.h"
#import "BBMUIWidgetsConfig.h"
#endif

@interface MapKey : NSObject
- (instancetype)init:(NSString *)key withProperty:(NSDictionary *)property;
- (BOOL)isEqual:(id)other;
- (id)copyWithZone:(NSZone *)zone;
@property NSString *key;
@property NSDictionary *property;

@end

@implementation MapKey
- (instancetype)init:(NSString *)key withProperty:(NSDictionary *)property
{
  self.key = key;
  self.property = property;

  return self;
}

- (BOOL)isEqual:(MapKey *) other
{
  // If the keys match...
  return [self.key isEqual:other.key] && (
    // and both properties are null
    (self.property == [NSNull null] && other.property == [NSNull null]) ||
    // or neither property is null, and they are equal.
    (self.property != [NSNull null] && other.property != [NSNull null]
     && [self.property isEqual:other.property]));
}

- (id)copyWithZone:(NSZone *)zone
{
  return [[MapKey allocWithZone:zone] init:self.key withProperty:self.property];
}

@end

@interface ProxiedMessage : BBMJSONMessage {}
- (id) initWithMessage:(NSDictionary *) message;
@end

@implementation ProxiedMessage {
  NSDictionary *message;
}

- (id) initWithMessage:(NSDictionary *) message
{
  self = [super init];

  self->message = message;

  return self;
}

- (NSDictionary *) requestDict
{
  return message;
}

@end

#if TARGET_OS_IPHONE
@interface PushHandler : NSObject

- (instancetype)init NS_DESIGNATED_INITIALIZER;

@end

@interface PushHandler () <PKPushRegistryDelegate> {
    PKPushRegistry *_pushRegistry;
    dispatch_queue_t _pushQueue;
}
@end

#pragma mark -

@implementation PushHandler

- (instancetype)init
{
    if( (self = [super init] ) ) {
        NSLog(@"PUSH: Initializing");

        //The BBME SDK requires the use of PushKit to handle incoming pushes.  PushKit push will
        //automatically wake the app and deliver the push payload via the didRecieve delegate method
        _pushQueue = dispatch_queue_create("PushQueue", NULL);
        _pushRegistry = [[PKPushRegistry alloc] initWithQueue:_pushQueue];
        _pushRegistry.delegate = self;
        _pushRegistry.desiredPushTypes = [NSSet setWithObject:PKPushTypeVoIP];
    }
    return self;
}

#pragma mark - PKPushRegistryDelegate

- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(NSString *)type
{
    if(type == PKPushTypeVoIP) {
        NSLog(@"PUSH: Got push credentials %@ for type %@", credentials.token, credentials.type);
        dispatch_async(dispatch_get_main_queue(), ^{
            //If using the BBM push server, you must set the token. 
            [[BBMEnterpriseService service] setPushToken:credentials.token];
        });
    }
}


- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload
                                                                          forType:(NSString *)type
                                                            withCompletionHandler:(nonnull void (^)(void))completion
{
    if(type == PKPushTypeVoIP) {
        NSLog(@"PUSH: Recieved");
        dispatch_async(dispatch_get_main_queue(), ^{
            NSDictionary *dictionaryPayload = payload.dictionaryPayload;
            //Check for the specific BBME keys in the push payload.
            if (dictionaryPayload[kBBMNewMessagePushKey] != nil  ||
                dictionaryPayload[kBBMCallInvitePushKey] != nil)
            {
                //This will notify BBME of the push payload which will wake the service and either
                //fetch the relevant data or connect any pending calls.  Notifications to the user
                //should be triggered off of the subsequent changes in the BBMDS model and or the
                //MediaManager callbacks.
                NSLog(@"PUSH: Forwarding push to BBMPlatformService");
                [[BBMEnterpriseService service] pushReceived:payload.dictionaryPayload];
            }else{
                //This push didn't originate from BBM.  If you're using your own push server,
                //forward the push here to the relevant service
            }
            completion();
        });
    }
}


- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(NSString *)type
{
    //Nothing to do if using the BBM push service.  Token invalidation will happen automatically
    //on the back end.
}

@end

#endif

//------------------------------------------------------------------------------
// plugin class
//------------------------------------------------------------------------------
@interface SparkProxy : CDVPlugin <BBMIncomingMessageListener> {}
- (void)setupStart:(CDVInvokedUrlCommand *)command;
- (void)stop:(CDVInvokedUrlCommand *)command;
- (void)invoke:(CDVInvokedUrlCommand *)command;
- (void)monitorStart:(CDVInvokedUrlCommand *)command;
- (void)monitorStop:(CDVInvokedUrlCommand *)command;
- (void)observeStart:(CDVInvokedUrlCommand *)command;
- (void)observeStop:(CDVInvokedUrlCommand *)command;
- (void)requestListAdd:(CDVInvokedUrlCommand *)command;
- (void)requestListChange:(CDVInvokedUrlCommand *)command;
- (void)requestListRemove:(CDVInvokedUrlCommand *)command;
- (void)dispose:(CDVInvokedUrlCommand *)command;
- (void)pushStart:(CDVInvokedUrlCommand *)command;
- (void)handleIncomingCalls:(CDVInvokedUrlCommand *)command;
- (void)makeCall:(CDVInvokedUrlCommand *)command;
@end

@implementation SparkProxy {
  NSString *monitor;

  // Track the spark observers separately. Realistically there will probably
  // only be one, but be robust anyway.
  NSMutableDictionary *sparkObservers;

  // The set of lists which are currently being observed. It may be because the
  // whole list is observed, or a criterion is observed on it, or an element
  // is observed in it. The value is the count of references to the list.
  NSMutableDictionary *observedLists;

  // The set of lists for which the whole list is being observed.
  NSMutableSet *observedAsList;

  // A map from list to a MapKey containing criteria to be observed on that
  // list.
  NSMutableDictionary *observedWithCriteria;

  // A map from list to a MapKey containing the element to be observed in that
  // list.
  NSMutableDictionary *observedForElement;

  // The set of non-list messages to proxy.
  NSMutableSet *messagesToProxy;

  // Whether the user has already created an account. Once this is done,
  // another create may not be attempted until the current account is disposed.
  BOOL started;

#if TARGET_OS_IPHONE
  BBMMediaCallManager *mediaCallManager;

  PushHandler *pushHandler; 
#endif
}

- (ObservableMonitor *)createSparkObserver:(NSString *)key withProperty:(NSString *)property {
  return [ObservableMonitor monitorActivatedWithName:@"sparkWatcher" block:^{
    BBMEnterpriseService *service = [BBMEnterpriseService service];
    BBMCoreServiceState state = [service serviceState];
    NSString *stateAsString;
    switch(state) {
      case BBMCoreServiceStateNotStarted:
      case BBMCoreServiceStateRestarting:
      case BBMCoreServiceStateStopped:
        stateAsString = @"Stopped";
        break;
      case BBMCoreServiceStateStopping:
      case BBMCoreServiceStateStarted:
        stateAsString = @"Started";
        break;
      case BBMCoreServiceStatePlatformError:
      case BBMCoreServiceStateError:
      case BBMCoreServiceStateFatalError:
      default:
        stateAsString = @"Failed";
        break;
    }
    NSArray *array = @[key, property, stateAsString];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
    result.keepCallback = @YES;
    [self.commandDelegate sendPluginResult:result callbackId:monitor];
  }];
}

- (void)pluginInitialize
{
  monitor = nil;
  sparkObservers = [[NSMutableDictionary alloc] init];
  observedLists = [[NSMutableDictionary alloc] init];
  observedAsList = [[NSMutableSet alloc] init];
  observedWithCriteria = [[NSMutableDictionary alloc] init];
  observedForElement = [[NSMutableDictionary alloc] init];
  messagesToProxy = [[NSMutableSet alloc] init];

  started = NO;
}

- (void)setupStart:(CDVInvokedUrlCommand*)command
{
  // Extract the parameters.
  NSString *domain = [command.arguments objectAtIndex:0];
  NSString *environmentString = [command.arguments objectAtIndex:1];
  NSString *descriptionString = [command.arguments objectAtIndex:2];
  BBMConfigEnvironment environment;

  // Validate the configuration
  if (environmentString == nil || [environmentString isEqual:@"Sandbox"])
  {
    environment = kBBMConfig_Sandbox;
  }
  else if([environmentString isEqual:@"Production"])
  {
    environment = kBBMConfig_Production;
  }
  else
  {
    CDVPluginResult* result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR messageAsString:@"Invalid environment"];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    return;
  }

  started = YES;

  // Instantiate the spark SDK.
  [[BBMEnterpriseService service] start:domain environment:environment completionBlock:^(BOOL success) {
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsBool:success];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];

    if (success) {
      // Go through the observable list and register all listeners.
      [[BBMEnterpriseService service] addListener:self forMessageTypes:[observedLists allKeys]];

      [[BBMEnterpriseService service] addListener:self forMessageNames:[messagesToProxy allObjects]];

      // Trigger the initial fetch for all listeners.

      // First the complete lists.
      for(NSString *key in observedAsList) {
        BBMRequestListAllMessage *message = [[BBMRequestListAllMessage alloc]
                                                    initWithType:key];
        [[BBMEnterpriseService service] sendMessageToService:message];
      }

      // Then the criteria.
      for(NSString *key in observedWithCriteria) {
        for(MapKey *mapKey in [observedWithCriteria objectForKey:key]) {
          BBMRequestListMatchingMessage *message = [[BBMRequestListMatchingMessage alloc]
                                                      initWithCriteria: mapKey.property
                                                      type:key];
          [[BBMEnterpriseService service] sendMessageToService:message];
        }
      }

      // And finally the elements.
      for(NSString *key in observedForElement) {
        for(MapKey *mapKey in [observedForElement objectForKey:key]) {
          BBMRequestListElementsMessage *message = [[BBMRequestListElementsMessage alloc]
                                                      initWithElements:@[mapKey.property]
                                                      type:key];
          [[BBMEnterpriseService service] sendMessageToService:message];
        }
      }
      
      // TODO: Workaround for a bug in the R7 SDK. The spark observer will be
      // wiped out on startup, so reset it. Remove this code once the problem is
      // fixed.
      for(NSString *property in sparkObservers) {
        ObservableMonitor *observable;
        observable = [self createSparkObserver:@"Spark" withProperty:property];
        [sparkObservers setObject:observable forKey:property];
      }
    }
  }];
}

/**
 * Shut down the SDK. It cannot be used again until setupStart is called.
 */
- (void)stop:(CDVInvokedUrlCommand*)command
{
  [[BBMEnterpriseService service] stop];
}

/**
 * Replace any arrays or strings in an array with NSNumbers.
 * @param array The array of values to replace.
 */
static NSMutableArray *replaceNumbers(NSArray *array)
{
  NSMutableArray *newArray = [[NSMutableArray alloc] initWithCapacity:[array count]];
  for(int i = 0; i < [array count]; i++) {
    if([array[i] isKindOfClass:[NSArray class]]) {
      newArray[i] = replaceNumbers(array[i]);
    } else {
      newArray[i] = [NSNumber numberWithLongLong:[((NSString *)array[i]) longLongValue]];
    }
  }

  return newArray;
}

/**
 * We are receiving numbers from JavaScript, which represents large integers
 * imprecisely, where "large" is actually small enough that we really use those
 * numbers in some cases. To work around this, allow JavaScript to pass these
 * numbers as strings, and to specify in \a updates which values need to be
 * replaced.
 *
 * @param object The object which contains strings that need to be replaced
 *               with numbers.
 * @param updates The array of names of elements to index object, to find the
 *                strings to replace.
 * @param index The index into updates for the name of the property in the
 *              object passed in. This function is recursive, this allows
 *              passing the original 'updates' without constructing
 *              subsequences of it.
 */
static NSObject *fixNumbers(NSObject *object, NSArray *updates, int index)
{
  if([object isKindOfClass:[NSArray class]]) {
    NSArray *array = (NSArray *)object;
    NSMutableArray *newArray = [[NSMutableArray alloc] initWithCapacity:[array count]];
    // If it's an array, then recurse on all elements.
    for(int i = 0; i < [array count]; i++) {
      newArray[i] = fixNumbers(array[i], updates, index);
    }
    return newArray;
  } else {
    NSDictionary *dict = (NSDictionary *)object;
    NSMutableDictionary *newDict = [[NSMutableDictionary alloc] initWithDictionary:dict];
    // If it's an object, index it using updates.

    // If we're now done searching, then update the object. If we're not
    // done yet, then recurse.
    NSString *name = updates[index];
    NSObject *target = [dict valueForKey:name];
    if(index + 1 == [updates count]) {
      // We are done. If what we see is an array, then build an object to
      // put. If it's a string, then convert it to an int and store it.
      if([target isKindOfClass:[NSArray class]]) {
        NSArray *array = (NSArray *)target;
        [newDict setObject:replaceNumbers(array) forKey:updates[index]];
      } else {
        // This will be a string.
        [newDict setObject: [NSNumber numberWithLongLong:[(NSString *)[dict valueForKey:updates[index]] longLongValue]] forKey:name];
      }
    } else {
      [newDict setObject: fixNumbers(target, updates, index+1) forKey:name];
    }
    return newDict;
  }
}


/**
 * Send a message to bbmcore. Consult the messages section of BBMDS to see what can be sent.
 */
- (void)invoke:(CDVInvokedUrlCommand *)command
{
  @try
  {
    NSDictionary *args = [command.arguments objectAtIndex:0];

    // See if we need to convert any strings to numbers.
    if ([command.arguments count] == 2) {
      // Do the conversion.
      NSArray *updates = [command.arguments objectAtIndex:1];
      NSMutableDictionary *newDict = [[NSMutableDictionary alloc] initWithCapacity:1];
      NSString *key = [[args keyEnumerator] nextObject];
      for (NSArray *update in updates) {
        [newDict setObject:(NSDictionary *)fixNumbers([args valueForKey:key],
                                                      update, 0)
                 forKey:key];
        // Swap out the arguments with the updated copy.
        args = newDict;
      }
    }

    ProxiedMessage *messageWrapper = [[ProxiedMessage alloc] initWithMessage:args];

    [[BBMEnterpriseService service] sendMessageToService:messageWrapper];
  }
  @catch(NSException *e)
  {
    NSLog(@"Got an exception");
  }
}

- (void)dispose:(CDVInvokedUrlCommand*)command
{
  started = false;
}

- (void)pushStart:(CDVInvokedUrlCommand *)command
{
#if TARGET_OS_IPHONE
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        self->pushHandler = [[PushHandler alloc] init];
    });
#endif
}

- (void)handleIncomingCalls:(CDVInvokedUrlCommand *)command
{
#if TARGET_OS_IPHONE
  BBMMediaCallManagerConfig *config = [BBMMediaCallManagerConfig defaultConfig];
  config.applicationName = @"Sample app";
  mediaCallManager = [[BBMMediaCallManager alloc] initWithConfiguration: config];

  mediaCallManager.userNameResolver = ^(NSNumber *regId, UserNameResolverCallback callback) {
    BBMAppUser *appUser = [BBMUIUtilities userForRegId:regId];
    callback(appUser ? appUser.name : regId.stringValue);
  };

  mediaCallManager.avatarResolver = ^(NSNumber *regId, UserAvatarResolverCallback callback) {
    BBMAppUser *appUser = [BBMUIUtilities userForRegId:regId];
    if(appUser.avatarUrl) {
      callback([NSURL URLWithString:appUser.avatarUrl]);
    } else {
      callback([[NSBundle mainBundle] URLForResource:kStrDefaultAvatarImage withExtension:nil]);
    }
  };

  mediaCallManager.callResultCallback = ^(BBMCallCompletionResult action) {
    NSLog(@"Call Action Complete: %d", action);
  };

  //Request permission for the microphone.
  MediaPermissionsCallback callback = ^(BOOL granted){
    if(granted) {
        CDVPluginResult* result =
          [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                           messageAsArray:@[]];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];

        // Permission was granted, so start listeneing for incoming calls.
        [mediaCallManager startListening];
    } else {
        CDVPluginResult* result =
          [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                           messageAsString:@"Permission denied"];
        [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
  };

  [[[BBMEnterpriseService service] mediaManager] requestMediaPermissionsWithCallback:callback mode:kVoice];
#endif
}

-(void)makeCall:(CDVInvokedUrlCommand *)command
{
#if TARGET_OS_IPHONE
  NSDictionary *options = [command.arguments objectAtIndex:0];
  NSString *mode = [options objectForKey:@"mode"];
  NSString *regId = [options objectForKey:@"regId"];
  MediaMode callMode;
  
  if([mode isEqualToString:@"video"]) {
    callMode = kVideo;
  } else if([mode isEqualToString:@"voice"]) {
    callMode = kVoice;
  } else {
    CDVPluginResult* result =
      [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                       messageAsString:@"Invalid environment for mode"];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    return;
  }
  NSNumber *regIdNumber = [NSNumber numberWithLongLong:[regId longLongValue]];
  
  [mediaCallManager startCall:callMode regId:regIdNumber callback:^(BOOL success) {
    if(success) {
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:@[]];
      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    } else {
      CDVPluginResult* result =
        [CDVPluginResult resultWithStatus:CDVCommandStatus_ERROR
                         messageAsString:@"Unable to place call"];
      [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
    }
  }];
#endif
}

- (void)monitorStart:(CDVInvokedUrlCommand *)command
{
  // All that's needed here is to remember the callbackId.
  self->monitor = command.callbackId;
}

- (void)monitorStop:(CDVInvokedUrlCommand *)command {
  self->monitor = nil;
}

- (void)observeStart:(CDVInvokedUrlCommand*)command
{
  NSString *key = [command.arguments objectAtIndex:0];

  NSLog(@"Observe %@", key);
  // Spark is handled specially. These properties are available even before
  // startup.
  if([key isEqualToString:@"Spark"]) {
    // We can always observe spark values, even if the SDK hasn't started.
    ObservableMonitor *observable;
    NSString *property = [command.arguments objectAtIndex:1];
    observable = [self createSparkObserver:key withProperty:property];
    [sparkObservers setObject:observable forKey:property];
  } else if([key isEqualToString:@"ProtocolMessages"]) {
    NSDictionary *property = [command.arguments objectAtIndex:1];
    if(property != [NSNull null]) {
      NSString *name = [property valueForKey:@"value"];
      [messagesToProxy addObject:name];

      if(started) {
        [[BBMEnterpriseService service] addListener:self forMessageNames:@[name]];
      }
    }
  } else {
    // Access a regular key.
    NSDictionary *property = [command.arguments objectAtIndex:1];

    // If we're not listening to the appropriate list, then start.
    NSNumber *count = [observedLists objectForKey:key];
    BOOL newList = count == nil;
    [observedLists setObject:[NSNumber numberWithInt:(newList
                                                        ? 1
                                                        : [count intValue] + 1)]
                   forKey:key];

    // Remember what we're looking for. Remember whether it's a criterion,
    // because this shows whether we should return results as elements or a list.
    NSNumber *criterion = [command.arguments objectAtIndex:2];
    MapKey *mapKey = [[MapKey alloc] init:key withProperty:property];

    // Record what we are listening to.
    if(property != [NSNull null]) {
      if([criterion boolValue]) {
        // See if this element is in the dictionary. If it is, add to the list
        // there. If not, add a list and add this element.
        NSMutableSet *set = [observedWithCriteria valueForKey:key];
        if(set == nil) {
          set = [[NSMutableSet alloc] init];
          [observedWithCriteria setObject:set forKey:key];
        }
        [set addObject:mapKey];
      } else {
        // See if this element is in the dictionary. If it is, add to the list
        // there. If not, add a list and add this element.
        NSMutableSet *set = [observedForElement valueForKey:key];
        if(set == nil) {
          set = [[NSMutableSet alloc] init];
          [observedForElement setObject:set forKey:key];
        }
        [set addObject:mapKey];
      }
    } else {
      [observedAsList addObject:key];
    }

    if(started) {
      if(newList) {
        [[BBMEnterpriseService service] addListener:self forMessageTypes:@[key]];
      }

      // If a particular property should be observed, then request the property.
      if(property != [NSNull null]) {
        // If it's a criterion, issue a requestListMatching.
        if([criterion boolValue]) {
          BBMRequestListMatchingMessage *message = [[BBMRequestListMatchingMessage alloc]
                                                      initWithCriteria:property
                                                      type:key];
          [[BBMEnterpriseService service] sendMessageToService:message];
        } else {
          // Otherwise, issue a requestListElements.
          BBMRequestListElementsMessage *message = [[BBMRequestListElementsMessage alloc]
                                                      initWithElements:@[property]
                                                      type:key];
          [[BBMEnterpriseService service] sendMessageToService:message];
        }
      } else {
        // It's just a list, request the whole list.
        BBMRequestListAllMessage *message = [[BBMRequestListAllMessage alloc]
                                                    initWithType:key];
        [[BBMEnterpriseService service] sendMessageToService:message];
      }
    }
  }
}

- (void)observeStop:(CDVInvokedUrlCommand*)command {
  NSString *key = [command.arguments objectAtIndex:0];

  if([key isEqualToString:@"Spark"]) {
    NSString *property = [command.arguments objectAtIndex:1];
    [(ObservableMonitor *)[sparkObservers objectForKey:property] deActivate];
    [sparkObservers removeObjectForKey:property];
  } else if([key isEqualToString:@"ProtocolMessages"]) {
    NSDictionary *property = [command.arguments objectAtIndex:1];
    NSString *name = [property valueForKey:@"value"];
    if(property != [NSNull null]) {
      [messagesToProxy removeObject:name];
    }
    [[BBMEnterpriseService service] removeListener:self forMessageNames:@[name]];
  } else {
    NSDictionary *property = [command.arguments objectAtIndex:1];
    NSNumber *criterion = [command.arguments objectAtIndex:2];
    NSNumber *count = [observedLists objectForKey:key];

    if([count intValue] > 1) {
      [observedLists setObject:[NSNumber numberWithInteger:[count intValue] - 1] forKey: key];
    } else {
      [observedLists removeObjectForKey: key];
      [[BBMEnterpriseService service] removeListener:self forMessageTypes:@[key]];
    }

    if(property == [NSNull null]) {
      [observedAsList removeObject:key];
    } else {
      MapKey *mapKey = [[MapKey alloc] init:key withProperty:property];

      if([criterion intValue]) {
        // First, find the set corresponding to the key.
        NSMutableSet *set = [observedWithCriteria objectForKey:key];

        // Remove from the set.
        [set removeObject:mapKey];

        // If the set is empty, remove the set itself.
        if([set count] == 0) {
          [observedWithCriteria removeObjectForKey:key];
        }
      } else {
        // First, find the set corresponding to the key.
        NSMutableSet *set = [observedForElement objectForKey:key];

        // Remove from the set.
        [set removeObject:mapKey];

        // If the set is empty, remove the set itself.
        if([set count] == 0) {
          [observedForElement removeObjectForKey:key];
        }
      }
    }
  }
}

- (void)requestListAdd:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSArray *elements = [command.arguments objectAtIndex:1];

  BBMRequestListAddMessage *message = [[BBMRequestListAddMessage alloc]
                                            initWithElements:elements
                                            type:key];
  [[BBMEnterpriseService service] sendMessageToService:message];
}

- (void)requestListChange:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSArray *elements = [command.arguments objectAtIndex:1];

  BBMRequestListChangeMessage *message = [[BBMRequestListChangeMessage alloc]
                                            initWithElements:elements
                                            type:key];
  [[BBMEnterpriseService service] sendMessageToService:message];
}

- (void)requestListRemove:(CDVInvokedUrlCommand *)command {
  NSString *key = [command.arguments objectAtIndex:0];
  NSArray *elements = [command.arguments objectAtIndex:1];

  BBMRequestListRemoveMessage *message = [[BBMRequestListRemoveMessage alloc]
                                            initWithElements:elements
                                            type:key];
  [[BBMEnterpriseService service] sendMessageToService:message];
}

#pragma mark - BBMIncomingMessageListener

// Not needed, we will use receivedJSONIncomingMessage
- (void)receivedIncomingMessage:(BBMIncomingMessage *)incomingMessage
{
}

- (void)receivedJSONIncomingMessage:(NSDictionary *)incomingMessage
{
  NSLog(@"Observed %@", incomingMessage);
  NSString *type;
  NSArray *elements = nil;
  BOOL removal = NO;
  NSString *messageName = [[incomingMessage keyEnumerator] nextObject];

  // The list types need some special handling.
  if([messageName isEqualToString:@"listAdd"] ||
     [messageName isEqualToString:@"listRemove"] ||
     [messageName isEqualToString:@"listChange"] ||
     [messageName isEqualToString:@"listChunk"]) {
    // These have a type, and also some content.
    type = [[incomingMessage objectForKey:messageName] objectForKey:@"type"];
    elements = [[incomingMessage objectForKey:messageName] objectForKey:@"elements"];
  } else if([messageName isEqualToString:@"listAll"] ||
            [messageName isEqualToString:@"listResync"] ||
            [messageName isEqualToString:@"listElements"]) {
    // These have a type, but no content.
    type = [[incomingMessage objectForKey:messageName] objectForKey:@"type"];
  } else {
    if([messagesToProxy containsObject:messageName]) {
      NSArray *array = @[@"ProtocolMessages", @{@"value": messageName}, [incomingMessage objectForKey:messageName]];;
      CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
      result.keepCallback = @YES;
      [self.commandDelegate sendPluginResult:result callbackId:monitor];
    }
    return;
  }

  // Handle any observers on the list.
  if([observedAsList containsObject:type]) {
    NSArray *array = @[type, @"", incomingMessage];
    CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
    result.keepCallback = @YES;
    [self.commandDelegate sendPluginResult:result callbackId:monitor];
  }

  // Handle any observers with criteria.
  NSSet *criteriaSet = [observedWithCriteria objectForKey:type];
  if(criteriaSet) {
    // We have criteria. Look at each one. Each one may need a response.
    for(MapKey *key in criteriaSet) {
      // See if there is an elements for this list type. If there isn't, we just
      // return it.
      if(elements) {
        // There is an elements so filter that according to the criteria and
        // return the modified list.
        NSMutableArray *filteredByCriteria = [[NSMutableArray alloc] initWithCapacity:[elements count]];
        NSMutableDictionary *newValue = [[NSMutableDictionary alloc] init];
        [newValue setDictionary: [incomingMessage objectForKey: messageName]];
        // Iterate over the elements.
        for(NSDictionary *element in elements) {
          // Check all of the properties of the criterion and see if they match.
          bool matched = true;
          for(NSString *propertyName in key.property) {
            // Get the criterion value.
            NSString *criterionValue = [key.property objectForKey:propertyName];
            // Get the element value value.
            NSString *elementValue = [element objectForKey:propertyName];
            
            // Check if it's a match.
            if(!elementValue || ![elementValue isEqual:criterionValue]) {
              // Not a match, skip this element.
              matched = false;
              break;
            }
            
          }
          
          // It was a match. Add this element to the new list.
          if(matched) {
            [filteredByCriteria addObject:element];
          }
        }
        [newValue setObject:filteredByCriteria forKey: @"elements"];
        NSArray *array = @[key.key, key.property, @{messageName: newValue}];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
        result.keepCallback = @YES;
        [self.commandDelegate sendPluginResult:result callbackId:monitor];
      } else {
        // There were no elements in this list message. Just treat it like a
        // match and pass it through.
        NSArray *resultArray = @[key.key, key.property, incomingMessage];
        CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:resultArray];
        result.keepCallback = @YES;
        [self.commandDelegate sendPluginResult:result callbackId:monitor];
      }
    }
  }
  
  // Handle any observers for an element.
  NSSet *elementSet;
  elementSet = [observedForElement objectForKey:type];
  if(elementSet) {
    // See if there is an elements for this list type. If there isn't, we just
    // drop it.
    if(elements) {
      // We have elements. Look at each one. Each one may need a response.
      for(MapKey *key in elementSet) {
        // Iterate over the elements.
        for(NSDictionary *element in elements) {
          // Check all of the properties of the criterion and see if they match.
          bool matched = true;
          for(NSString *propertyName in key.property) {
            // Get the primary key value.
            NSString *primaryKeyValue = [key.property objectForKey:propertyName];
            // Get the element value value.
            NSString *elementValue = [element objectForKey:propertyName];
            
            // Check if it's a match.
            if(!elementValue || ![elementValue isEqual:primaryKeyValue]) {
              // Not a match, skip this element.
              matched = false;
              break;
            }
            
          }
          
          // It was a match. Report on this element.
          if(matched) {
            NSArray *array;
            if(!removal) {
              if([key.key isEqualToString:@"global"]) {
                array = @[key.key, key.property, [element objectForKey: @"value"], [NSNumber numberWithBool:YES]];
              } else {
                array = @[key.key, key.property, element, [NSNumber numberWithBool:YES]];
              }
            } else {
              // It's a removal.
              array = @[key.key, key.property, [NSNull null]];
            }
            CDVPluginResult *result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK messageAsArray:array];
            result.keepCallback = @YES;
            [self.commandDelegate sendPluginResult:result callbackId:monitor];
          }
        }
      }
    }
  }
}

#pragma mark -
@end
