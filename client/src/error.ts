/// <reference path="../typings/extern.d.ts"/>
import ChannerProto = Proto2TypeScript.ChannerProto;

export var errorMessages : { [x: number]: string } = []

errorMessages[ChannerProto.Error.Type.Timeout] = "request timeout";
errorMessages[ChannerProto.Error.Type.InvalidPayload] = "invalid payload sent";
errorMessages[ChannerProto.Error.Type.RuntimeError] = "internal server error";
errorMessages[ChannerProto.Error.Type.TemporaryUnavailable] = "service temporary unavailable";

errorMessages[ChannerProto.Error.Type.Login_InvalidAuth] = "Login: authentification failure";
errorMessages[ChannerProto.Error.Type.Login_UserNotFound] = "Login: user not found";
errorMessages[ChannerProto.Error.Type.Login_UserAlreadyExists] = "Login: user already exists";
errorMessages[ChannerProto.Error.Type.Login_OutdatedVersion] = "Login: client version is outdated";
errorMessages[ChannerProto.Error.Type.Login_DatabaseError] = "Login: database error";
errorMessages[ChannerProto.Error.Type.Login_BrokenClientData] = "Login: client data seems broken";

errorMessages[ChannerProto.Error.Type.Rescue_CannotRescue] = "Rescue: something wrong with rescue";
errorMessages[ChannerProto.Error.Type.Rescue_DatabaseError] = "Rescue: database error";
errorMessages[ChannerProto.Error.Type.Rescue_InvalidAuth] = "Rescue: authentification failure";

errorMessages[ChannerProto.Error.Type.ChannelCreate_DatabaseError] = "Channel Create: database error";
errorMessages[ChannerProto.Error.Type.ChannelList_DatabaseError] = "Channel List: database error";

