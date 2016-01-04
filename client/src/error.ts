/// <reference path="../typings/channer.proto.d.ts"/>
import ChannerProto = Proto2TypeScript.ChannerProto;

export var errorMessages : { [x: number]: string } = []

errorMessages[ChannerProto.Error.Type.Timeout] = "request timeout";
errorMessages[ChannerProto.Error.Type.Login_InvalidAuth] = "Login: authentification failure";
errorMessages[ChannerProto.Error.Type.Login_UserNotFound] = "Login: user not found";
errorMessages[ChannerProto.Error.Type.Login_UserAlreadyExists] = "Login: user already exists";
errorMessages[ChannerProto.Error.Type.Login_OutdatedVersion] = "Login: client version is outdated";
errorMessages[ChannerProto.Error.Type.Login_DatabaseError] = "Login: database error";
errorMessages[ChannerProto.Error.Type.Login_BrokenClientData] = "Login: client data seems broken";