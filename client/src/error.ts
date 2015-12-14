/// <reference path="../typings/channer.proto.d.ts"/>

export var errorMessages : { [x: number]: string } = []

errorMessages[ChannerProto.Error.Type.Timeout] = "timeout";
errorMessages[ChannerProto.Error.Type.Login_InvalidAuth] = "Login: authentification failure";
errorMessages[ChannerProto.Error.Type.Login_UserNotFound] = "Login: user not found";
errorMessages[ChannerProto.Error.Type.Login_UserAlreadyExists] = "Login: user already exists";
