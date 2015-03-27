#import <UIKit/UIKit.h>
#import <Cordova/CDV.h>

@interface Restarter : CDVPlugin

- (void)restart:(CDVInvokedUrlCommand*)command;

@end