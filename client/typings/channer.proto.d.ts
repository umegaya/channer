// generated by Proto2Typescript. do not touch!

declare module Proto2TypeScript {
	interface ProtoBufModel {
		toArrayBuffer(): ArrayBuffer;
		//toBuffer(): NodeBuffer;
		//encode(): ByteBuffer;
		toBase64(): string;
		toString(): string;
	}

	export interface ProtoBufBuilder {
		gogoproto: gogoprotoBuilder;
		ChannerProto: ChannerProtoBuilder;
		
	}
}

declare module Proto2TypeScript {

	export interface gogoproto extends ProtoBufModel {
		
	}
	
	export interface gogoprotoBuilder {
		new(): gogoproto;
		decode(buffer: ArrayBuffer) : gogoproto;
		//decode(buffer: NodeBuffer) : gogoproto;
		//decode(buffer: ByteArrayBuffer) : gogoproto;
		decode64(buffer: string) : gogoproto;
		
	}	
}

declare module Proto2TypeScript {

	export interface ChannerProto extends ProtoBufModel {
		
	}
	
	export interface ChannerProtoBuilder {
		new(): ChannerProto;
		decode(buffer: ArrayBuffer) : ChannerProto;
		//decode(buffer: NodeBuffer) : ChannerProto;
		//decode(buffer: ByteArrayBuffer) : ChannerProto;
		decode64(buffer: string) : ChannerProto;
		HLC: ChannerProto.HLCBuilder;
		Post: ChannerProto.PostBuilder;
		Topic: ChannerProto.TopicBuilder;
		Model: ChannerProto.ModelBuilder;
		LoginRequest: ChannerProto.LoginRequestBuilder;
		PostRequest: ChannerProto.PostRequestBuilder;
		FetchRequest: ChannerProto.FetchRequestBuilder;
		ReadRequest: ChannerProto.ReadRequestBuilder;
		EnterTopicRequest: ChannerProto.EnterTopicRequestBuilder;
		ExitTopicRequest: ChannerProto.ExitTopicRequestBuilder;
		PingRequest: ChannerProto.PingRequestBuilder;
		RescueRequest: ChannerProto.RescueRequestBuilder;
		ChannelCreateRequest: ChannerProto.ChannelCreateRequestBuilder;
		ChannelListRequest: ChannerProto.ChannelListRequestBuilder;
		LoginResponse: ChannerProto.LoginResponseBuilder;
		PostResponse: ChannerProto.PostResponseBuilder;
		FetchResponse: ChannerProto.FetchResponseBuilder;
		ReadResponse: ChannerProto.ReadResponseBuilder;
		EnterTopicResponse: ChannerProto.EnterTopicResponseBuilder;
		ExitTopicResponse: ChannerProto.ExitTopicResponseBuilder;
		PingResponse: ChannerProto.PingResponseBuilder;
		RescueResponse: ChannerProto.RescueResponseBuilder;
		ChannelCreateResponse: ChannerProto.ChannelCreateResponseBuilder;
		ChannelListResponse: ChannerProto.ChannelListResponseBuilder;
		Error: ChannerProto.ErrorBuilder;
		Payload: ChannerProto.PayloadBuilder;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface HLC extends ProtoBufModel {
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		logical_ts: number;
		getLogicalTs() : number;
		setLogicalTs(logicalTs : number): void;
		
	}
	
	export interface HLCBuilder {
		new(): HLC;
		decode(buffer: ArrayBuffer) : HLC;
		//decode(buffer: NodeBuffer) : HLC;
		//decode(buffer: ByteArrayBuffer) : HLC;
		decode64(buffer: string) : HLC;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface Post extends ProtoBufModel {
		text: string;
		getText() : string;
		setText(text : string): void;
		ts?: HLC;
		getTs() : HLC;
		setTs(ts : HLC): void;
		options?: Post.Options;
		getOptions() : Post.Options;
		setOptions(options : Post.Options): void;
		
	}
	
	export interface PostBuilder {
		new(): Post;
		decode(buffer: ArrayBuffer) : Post;
		//decode(buffer: NodeBuffer) : Post;
		//decode(buffer: ByteArrayBuffer) : Post;
		decode64(buffer: string) : Post;
		Options: Post.OptionsBuilder;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Post {

	export interface Options extends ProtoBufModel {
		refers: HLC[];
		getRefers() : HLC[];
		setRefers(refers : HLC[]): void;
		fetch_url?: boolean;
		getFetchUrl() : boolean;
		setFetchUrl(fetchUrl : boolean): void;
		
	}
	
	export interface OptionsBuilder {
		new(): Options;
		decode(buffer: ArrayBuffer) : Options;
		//decode(buffer: NodeBuffer) : Options;
		//decode(buffer: ByteArrayBuffer) : Options;
		decode64(buffer: string) : Options;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface Topic extends ProtoBufModel {
		name: string;
		getName() : string;
		setName(name : string): void;
		last_read_ts: HLC;
		getLastReadTs() : HLC;
		setLastReadTs(lastReadTs : HLC): void;
		recent_posts: Post[];
		getRecentPosts() : Post[];
		setRecentPosts(recentPosts : Post[]): void;
		
	}
	
	export interface TopicBuilder {
		new(): Topic;
		decode(buffer: ArrayBuffer) : Topic;
		//decode(buffer: NodeBuffer) : Topic;
		//decode(buffer: ByteArrayBuffer) : Topic;
		decode64(buffer: string) : Topic;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface Model extends ProtoBufModel {
		
	}
	
	export interface ModelBuilder {
		new(): Model;
		decode(buffer: ArrayBuffer) : Model;
		//decode(buffer: NodeBuffer) : Model;
		//decode(buffer: ByteArrayBuffer) : Model;
		decode64(buffer: string) : Model;
		Account: Model.AccountBuilder;
		Rescue: Model.RescueBuilder;
		Channel: Model.ChannelBuilder;
		Device: Model.DeviceBuilder;
		Node: Model.NodeBuilder;
		Persona: Model.PersonaBuilder;
		Post: Model.PostBuilder;
		Topic: Model.TopicBuilder;
		Reaction: Model.ReactionBuilder;
		Service: Model.ServiceBuilder;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Account extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		user: string;
		getUser() : string;
		setUser(user : string): void;
		type: Account.Type;
		getType() : Account.Type;
		setType(type : Account.Type): void;
		secret: string;
		getSecret() : string;
		setSecret(secret : string): void;
		pass: string;
		getPass() : string;
		setPass(pass : string): void;
		mail: string;
		getMail() : string;
		setMail(mail : string): void;
		status: number;
		getStatus() : number;
		setStatus(status : number): void;
		
	}
	
	export interface AccountBuilder {
		new(): Account;
		decode(buffer: ArrayBuffer) : Account;
		//decode(buffer: NodeBuffer) : Account;
		//decode(buffer: ByteArrayBuffer) : Account;
		decode64(buffer: string) : Account;
		Type: Account.Type;
		Status: Account.Status;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model.Account {
	export const enum Type {
		Unknown = 0,
		User = 1,
		Bot = 2,
		
	}
}

declare module Proto2TypeScript.ChannerProto.Model.Account {
	export const enum Status {
		None = 0,
		Banned = 1,
		Admin = 2,
		
	}
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Rescue extends ProtoBufModel {
		id: ByteBuffer;
		getId() : ByteBuffer;
		setId(id : ByteBuffer): void;
		account: Long;
		getAccount() : Long;
		setAccount(account : Long): void;
		valid_date: number;
		getValidDate() : number;
		setValidDate(validDate : number): void;
		
	}
	
	export interface RescueBuilder {
		new(): Rescue;
		decode(buffer: ArrayBuffer) : Rescue;
		//decode(buffer: NodeBuffer) : Rescue;
		//decode(buffer: ByteArrayBuffer) : Rescue;
		decode64(buffer: string) : Rescue;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Channel extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		name: string;
		getName() : string;
		setName(name : string): void;
		locale: string;
		getLocale() : string;
		setLocale(locale : string): void;
		category: number;
		getCategory() : number;
		setCategory(category : number): void;
		description?: string;
		getDescription() : string;
		setDescription(description : string): void;
		style: string;
		getStyle() : string;
		setStyle(style : string): void;
		established: number;
		getEstablished() : number;
		setEstablished(established : number): void;
		options: ByteBuffer;
		getOptions() : ByteBuffer;
		setOptions(options : ByteBuffer): void;
		
	}
	
	export interface ChannelBuilder {
		new(): Channel;
		decode(buffer: ArrayBuffer) : Channel;
		//decode(buffer: NodeBuffer) : Channel;
		//decode(buffer: ByteArrayBuffer) : Channel;
		decode64(buffer: string) : Channel;
		Options: Channel.OptionsBuilder;
		IdentityLevel: Channel.IdentityLevel;
		TopicDisplayStyle: Channel.TopicDisplayStyle;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model.Channel {

	export interface Options extends ProtoBufModel {
		identity?: IdentityLevel;
		getIdentity() : IdentityLevel;
		setIdentity(identity : IdentityLevel): void;
		topic_display_style?: TopicDisplayStyle;
		getTopicDisplayStyle() : TopicDisplayStyle;
		setTopicDisplayStyle(topicDisplayStyle : TopicDisplayStyle): void;
		topic_post_limit?: number;
		getTopicPostLimit() : number;
		setTopicPostLimit(topicPostLimit : number): void;
		anonymous_name?: string;
		getAnonymousName() : string;
		setAnonymousName(anonymousName : string): void;
		
	}
	
	export interface OptionsBuilder {
		new(): Options;
		decode(buffer: ArrayBuffer) : Options;
		//decode(buffer: NodeBuffer) : Options;
		//decode(buffer: ByteArrayBuffer) : Options;
		decode64(buffer: string) : Options;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model.Channel {
	export const enum IdentityLevel {
		Unknown = 0,
		None = 1,
		Topic = 2,
		Channel = 3,
		Account = 4,
		
	}
}

declare module Proto2TypeScript.ChannerProto.Model.Channel {
	export const enum TopicDisplayStyle {
		Invalid = 0,
		Tail = 1,
		Tree = 2,
		
	}
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Device extends ProtoBufModel {
		id: string;
		getId() : string;
		setId(id : string): void;
		type: string;
		getType() : string;
		setType(type : string): void;
		account: number;
		getAccount() : number;
		setAccount(account : number): void;
		last_from: string;
		getLastFrom() : string;
		setLastFrom(lastFrom : string): void;
		last_access: number;
		getLastAccess() : number;
		setLastAccess(lastAccess : number): void;
		
	}
	
	export interface DeviceBuilder {
		new(): Device;
		decode(buffer: ArrayBuffer) : Device;
		//decode(buffer: NodeBuffer) : Device;
		//decode(buffer: ByteArrayBuffer) : Device;
		decode64(buffer: string) : Device;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Node extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		address: string;
		getAddress() : string;
		setAddress(address : string): void;
		seed: number;
		getSeed() : number;
		setSeed(seed : number): void;
		
	}
	
	export interface NodeBuilder {
		new(): Node;
		decode(buffer: ArrayBuffer) : Node;
		//decode(buffer: NodeBuffer) : Node;
		//decode(buffer: ByteArrayBuffer) : Node;
		decode64(buffer: string) : Node;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Persona extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		channel: Long;
		getChannel() : Long;
		setChannel(channel : Long): void;
		account: Long;
		getAccount() : Long;
		setAccount(account : Long): void;
		name: string;
		getName() : string;
		setName(name : string): void;
		
	}
	
	export interface PersonaBuilder {
		new(): Persona;
		decode(buffer: ArrayBuffer) : Persona;
		//decode(buffer: NodeBuffer) : Persona;
		//decode(buffer: ByteArrayBuffer) : Persona;
		decode64(buffer: string) : Persona;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Post extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		topic: Long;
		getTopic() : Long;
		setTopic(topic : Long): void;
		persona: Long;
		getPersona() : Long;
		setPersona(persona : Long): void;
		attr: number;
		getAttr() : number;
		setAttr(attr : number): void;
		text: string;
		getText() : string;
		setText(text : string): void;
		
	}
	
	export interface PostBuilder {
		new(): Post;
		decode(buffer: ArrayBuffer) : Post;
		//decode(buffer: NodeBuffer) : Post;
		//decode(buffer: ByteArrayBuffer) : Post;
		decode64(buffer: string) : Post;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Topic extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		name: string;
		getName() : string;
		setName(name : string): void;
		upvote: number;
		getUpvote() : number;
		setUpvote(upvote : number): void;
		
	}
	
	export interface TopicBuilder {
		new(): Topic;
		decode(buffer: ArrayBuffer) : Topic;
		//decode(buffer: NodeBuffer) : Topic;
		//decode(buffer: ByteArrayBuffer) : Topic;
		decode64(buffer: string) : Topic;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Reaction extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		post: Long;
		getPost() : Long;
		setPost(post : Long): void;
		type: Reaction.Type;
		getType() : Reaction.Type;
		setType(type : Reaction.Type): void;
		persona: Long;
		getPersona() : Long;
		setPersona(persona : Long): void;
		text: string;
		getText() : string;
		setText(text : string): void;
		
	}
	
	export interface ReactionBuilder {
		new(): Reaction;
		decode(buffer: ArrayBuffer) : Reaction;
		//decode(buffer: NodeBuffer) : Reaction;
		//decode(buffer: ByteArrayBuffer) : Reaction;
		decode64(buffer: string) : Reaction;
		Type: Reaction.Type;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Model.Reaction {
	export const enum Type {
		Unknown = 0,
		Star = 1,
		Other = 2,
		Admin = 3,
		
	}
}

declare module Proto2TypeScript.ChannerProto.Model {

	export interface Service extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		channel: Long;
		getChannel() : Long;
		setChannel(channel : Long): void;
		account: Long;
		getAccount() : Long;
		setAccount(account : Long): void;
		
	}
	
	export interface ServiceBuilder {
		new(): Service;
		decode(buffer: ArrayBuffer) : Service;
		//decode(buffer: NodeBuffer) : Service;
		//decode(buffer: ByteArrayBuffer) : Service;
		decode64(buffer: string) : Service;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface LoginRequest extends ProtoBufModel {
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		user: string;
		getUser() : string;
		setUser(user : string): void;
		version: string;
		getVersion() : string;
		setVersion(version : string): void;
		mail?: string;
		getMail() : string;
		setMail(mail : string): void;
		id?: Long;
		getId() : Long;
		setId(id : Long): void;
		sign?: string;
		getSign() : string;
		setSign(sign : string): void;
		pass?: string;
		getPass() : string;
		setPass(pass : string): void;
		device_id?: string;
		getDeviceId() : string;
		setDeviceId(deviceId : string): void;
		device_type?: string;
		getDeviceType() : string;
		setDeviceType(deviceType : string): void;
		rescue?: string;
		getRescue() : string;
		setRescue(rescue : string): void;
		
	}
	
	export interface LoginRequestBuilder {
		new(): LoginRequest;
		decode(buffer: ArrayBuffer) : LoginRequest;
		//decode(buffer: NodeBuffer) : LoginRequest;
		//decode(buffer: ByteArrayBuffer) : LoginRequest;
		decode64(buffer: string) : LoginRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface PostRequest extends ProtoBufModel {
		topic_id: Long;
		getTopicId() : Long;
		setTopicId(topicId : Long): void;
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		post: Post;
		getPost() : Post;
		setPost(post : Post): void;
		
	}
	
	export interface PostRequestBuilder {
		new(): PostRequest;
		decode(buffer: ArrayBuffer) : PostRequest;
		//decode(buffer: NodeBuffer) : PostRequest;
		//decode(buffer: ByteArrayBuffer) : PostRequest;
		decode64(buffer: string) : PostRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface FetchRequest extends ProtoBufModel {
		start_at: HLC;
		getStartAt() : HLC;
		setStartAt(startAt : HLC): void;
		end_at?: HLC;
		getEndAt() : HLC;
		setEndAt(endAt : HLC): void;
		count?: number;
		getCount() : number;
		setCount(count : number): void;
		
	}
	
	export interface FetchRequestBuilder {
		new(): FetchRequest;
		decode(buffer: ArrayBuffer) : FetchRequest;
		//decode(buffer: NodeBuffer) : FetchRequest;
		//decode(buffer: ByteArrayBuffer) : FetchRequest;
		decode64(buffer: string) : FetchRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ReadRequest extends ProtoBufModel {
		topic_id: Long;
		getTopicId() : Long;
		setTopicId(topicId : Long): void;
		read_post_ts: HLC;
		getReadPostTs() : HLC;
		setReadPostTs(readPostTs : HLC): void;
		
	}
	
	export interface ReadRequestBuilder {
		new(): ReadRequest;
		decode(buffer: ArrayBuffer) : ReadRequest;
		//decode(buffer: NodeBuffer) : ReadRequest;
		//decode(buffer: ByteArrayBuffer) : ReadRequest;
		decode64(buffer: string) : ReadRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface EnterTopicRequest extends ProtoBufModel {
		topic_id: Long;
		getTopicId() : Long;
		setTopicId(topicId : Long): void;
		
	}
	
	export interface EnterTopicRequestBuilder {
		new(): EnterTopicRequest;
		decode(buffer: ArrayBuffer) : EnterTopicRequest;
		//decode(buffer: NodeBuffer) : EnterTopicRequest;
		//decode(buffer: ByteArrayBuffer) : EnterTopicRequest;
		decode64(buffer: string) : EnterTopicRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ExitTopicRequest extends ProtoBufModel {
		topic_id: Long;
		getTopicId() : Long;
		setTopicId(topicId : Long): void;
		
	}
	
	export interface ExitTopicRequestBuilder {
		new(): ExitTopicRequest;
		decode(buffer: ArrayBuffer) : ExitTopicRequest;
		//decode(buffer: NodeBuffer) : ExitTopicRequest;
		//decode(buffer: ByteArrayBuffer) : ExitTopicRequest;
		decode64(buffer: string) : ExitTopicRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface PingRequest extends ProtoBufModel {
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		
	}
	
	export interface PingRequestBuilder {
		new(): PingRequest;
		decode(buffer: ArrayBuffer) : PingRequest;
		//decode(buffer: NodeBuffer) : PingRequest;
		//decode(buffer: ByteArrayBuffer) : PingRequest;
		decode64(buffer: string) : PingRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface RescueRequest extends ProtoBufModel {
		account: Long;
		getAccount() : Long;
		setAccount(account : Long): void;
		sign: string;
		getSign() : string;
		setSign(sign : string): void;
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		
	}
	
	export interface RescueRequestBuilder {
		new(): RescueRequest;
		decode(buffer: ArrayBuffer) : RescueRequest;
		//decode(buffer: NodeBuffer) : RescueRequest;
		//decode(buffer: ByteArrayBuffer) : RescueRequest;
		decode64(buffer: string) : RescueRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ChannelCreateRequest extends ProtoBufModel {
		name: string;
		getName() : string;
		setName(name : string): void;
		locale: string;
		getLocale() : string;
		setLocale(locale : string): void;
		category: number;
		getCategory() : number;
		setCategory(category : number): void;
		description?: string;
		getDescription() : string;
		setDescription(description : string): void;
		style?: string;
		getStyle() : string;
		setStyle(style : string): void;
		options?: Model.Channel.Options;
		getOptions() : Model.Channel.Options;
		setOptions(options : Model.Channel.Options): void;
		
	}
	
	export interface ChannelCreateRequestBuilder {
		new(): ChannelCreateRequest;
		decode(buffer: ArrayBuffer) : ChannelCreateRequest;
		//decode(buffer: NodeBuffer) : ChannelCreateRequest;
		//decode(buffer: ByteArrayBuffer) : ChannelCreateRequest;
		decode64(buffer: string) : ChannelCreateRequest;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ChannelListRequest extends ProtoBufModel {
		query: ChannelListRequest.QueryType;
		getQuery() : ChannelListRequest.QueryType;
		setQuery(query : ChannelListRequest.QueryType): void;
		locale?: string;
		getLocale() : string;
		setLocale(locale : string): void;
		category?: number;
		getCategory() : number;
		setCategory(category : number): void;
		limit?: number;
		getLimit() : number;
		setLimit(limit : number): void;
		offset_id?: Long;
		getOffsetId() : Long;
		setOffsetId(offsetId : Long): void;
		
	}
	
	export interface ChannelListRequestBuilder {
		new(): ChannelListRequest;
		decode(buffer: ArrayBuffer) : ChannelListRequest;
		//decode(buffer: NodeBuffer) : ChannelListRequest;
		//decode(buffer: ByteArrayBuffer) : ChannelListRequest;
		decode64(buffer: string) : ChannelListRequest;
		QueryType: ChannelListRequest.QueryType;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.ChannelListRequest {
	export const enum QueryType {
		None = 0,
		New = 1,
		Popular = 2,
		
	}
}

declare module Proto2TypeScript.ChannerProto {

	export interface LoginResponse extends ProtoBufModel {
		id: Long;
		getId() : Long;
		setId(id : Long): void;
		secret: string;
		getSecret() : string;
		setSecret(secret : string): void;
		pass?: string;
		getPass() : string;
		setPass(pass : string): void;
		mail?: string;
		getMail() : string;
		setMail(mail : string): void;
		user?: string;
		getUser() : string;
		setUser(user : string): void;
		
	}
	
	export interface LoginResponseBuilder {
		new(): LoginResponse;
		decode(buffer: ArrayBuffer) : LoginResponse;
		//decode(buffer: NodeBuffer) : LoginResponse;
		//decode(buffer: ByteArrayBuffer) : LoginResponse;
		decode64(buffer: string) : LoginResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface PostResponse extends ProtoBufModel {
		posted_at: HLC;
		getPostedAt() : HLC;
		setPostedAt(postedAt : HLC): void;
		
	}
	
	export interface PostResponseBuilder {
		new(): PostResponse;
		decode(buffer: ArrayBuffer) : PostResponse;
		//decode(buffer: NodeBuffer) : PostResponse;
		//decode(buffer: ByteArrayBuffer) : PostResponse;
		decode64(buffer: string) : PostResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface FetchResponse extends ProtoBufModel {
		posts: Post[];
		getPosts() : Post[];
		setPosts(posts : Post[]): void;
		
	}
	
	export interface FetchResponseBuilder {
		new(): FetchResponse;
		decode(buffer: ArrayBuffer) : FetchResponse;
		//decode(buffer: NodeBuffer) : FetchResponse;
		//decode(buffer: ByteArrayBuffer) : FetchResponse;
		decode64(buffer: string) : FetchResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ReadResponse extends ProtoBufModel {
		
	}
	
	export interface ReadResponseBuilder {
		new(): ReadResponse;
		decode(buffer: ArrayBuffer) : ReadResponse;
		//decode(buffer: NodeBuffer) : ReadResponse;
		//decode(buffer: ByteArrayBuffer) : ReadResponse;
		decode64(buffer: string) : ReadResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface EnterTopicResponse extends ProtoBufModel {
		
	}
	
	export interface EnterTopicResponseBuilder {
		new(): EnterTopicResponse;
		decode(buffer: ArrayBuffer) : EnterTopicResponse;
		//decode(buffer: NodeBuffer) : EnterTopicResponse;
		//decode(buffer: ByteArrayBuffer) : EnterTopicResponse;
		decode64(buffer: string) : EnterTopicResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ExitTopicResponse extends ProtoBufModel {
		
	}
	
	export interface ExitTopicResponseBuilder {
		new(): ExitTopicResponse;
		decode(buffer: ArrayBuffer) : ExitTopicResponse;
		//decode(buffer: NodeBuffer) : ExitTopicResponse;
		//decode(buffer: ByteArrayBuffer) : ExitTopicResponse;
		decode64(buffer: string) : ExitTopicResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface PingResponse extends ProtoBufModel {
		walltime: number;
		getWalltime() : number;
		setWalltime(walltime : number): void;
		
	}
	
	export interface PingResponseBuilder {
		new(): PingResponse;
		decode(buffer: ArrayBuffer) : PingResponse;
		//decode(buffer: NodeBuffer) : PingResponse;
		//decode(buffer: ByteArrayBuffer) : PingResponse;
		decode64(buffer: string) : PingResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface RescueResponse extends ProtoBufModel {
		url: string;
		getUrl() : string;
		setUrl(url : string): void;
		remain: number;
		getRemain() : number;
		setRemain(remain : number): void;
		
	}
	
	export interface RescueResponseBuilder {
		new(): RescueResponse;
		decode(buffer: ArrayBuffer) : RescueResponse;
		//decode(buffer: NodeBuffer) : RescueResponse;
		//decode(buffer: ByteArrayBuffer) : RescueResponse;
		decode64(buffer: string) : RescueResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ChannelCreateResponse extends ProtoBufModel {
		channel: Model.Channel;
		getChannel() : Model.Channel;
		setChannel(channel : Model.Channel): void;
		
	}
	
	export interface ChannelCreateResponseBuilder {
		new(): ChannelCreateResponse;
		decode(buffer: ArrayBuffer) : ChannelCreateResponse;
		//decode(buffer: NodeBuffer) : ChannelCreateResponse;
		//decode(buffer: ByteArrayBuffer) : ChannelCreateResponse;
		decode64(buffer: string) : ChannelCreateResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface ChannelListResponse extends ProtoBufModel {
		list: Model.Channel[];
		getList() : Model.Channel[];
		setList(list : Model.Channel[]): void;
		
	}
	
	export interface ChannelListResponseBuilder {
		new(): ChannelListResponse;
		decode(buffer: ArrayBuffer) : ChannelListResponse;
		//decode(buffer: NodeBuffer) : ChannelListResponse;
		//decode(buffer: ByteArrayBuffer) : ChannelListResponse;
		decode64(buffer: string) : ChannelListResponse;
		
	}	
}

declare module Proto2TypeScript.ChannerProto {

	export interface Error extends ProtoBufModel {
		type: Error.Type;
		getType() : Error.Type;
		setType(type : Error.Type): void;
		explanation?: string;
		getExplanation() : string;
		setExplanation(explanation : string): void;
		
	}
	
	export interface ErrorBuilder {
		new(): Error;
		decode(buffer: ArrayBuffer) : Error;
		//decode(buffer: NodeBuffer) : Error;
		//decode(buffer: ByteArrayBuffer) : Error;
		decode64(buffer: string) : Error;
		Type: Error.Type;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Error {
	export const enum Type {
		Unknown = 0,
		Timeout = 1,
		InvalidPayload = 2,
		Login_InvalidAuth = 10,
		Login_UserNotFound = 11,
		Login_UserAlreadyExists = 12,
		Login_OutdatedVersion = 13,
		Login_DatabaseError = 14,
		Login_BrokenClientData = 15,
		Rescue_DatabaseError = 20,
		Rescue_CannotRescue = 21,
		Rescue_InvalidAuth = 22,
		ChannelCreate_DatabaseError = 30,
		ChannelList_DatabaseError = 40,
		
	}
}

declare module Proto2TypeScript.ChannerProto {

	export interface Payload extends ProtoBufModel {
		type: Payload.Type;
		getType() : Payload.Type;
		setType(type : Payload.Type): void;
		msgid?: number;
		getMsgid() : number;
		setMsgid(msgid : number): void;
		login_request?: LoginRequest;
		getLoginRequest() : LoginRequest;
		setLoginRequest(loginRequest : LoginRequest): void;
		post_request?: PostRequest;
		getPostRequest() : PostRequest;
		setPostRequest(postRequest : PostRequest): void;
		fetch_request?: FetchRequest;
		getFetchRequest() : FetchRequest;
		setFetchRequest(fetchRequest : FetchRequest): void;
		read_request?: ReadRequest;
		getReadRequest() : ReadRequest;
		setReadRequest(readRequest : ReadRequest): void;
		enter_topic_request?: EnterTopicRequest;
		getEnterTopicRequest() : EnterTopicRequest;
		setEnterTopicRequest(enterTopicRequest : EnterTopicRequest): void;
		exit_topic_request?: ExitTopicRequest;
		getExitTopicRequest() : ExitTopicRequest;
		setExitTopicRequest(exitTopicRequest : ExitTopicRequest): void;
		ping_request?: PingRequest;
		getPingRequest() : PingRequest;
		setPingRequest(pingRequest : PingRequest): void;
		rescue_request?: RescueRequest;
		getRescueRequest() : RescueRequest;
		setRescueRequest(rescueRequest : RescueRequest): void;
		channel_create_request?: ChannelCreateRequest;
		getChannelCreateRequest() : ChannelCreateRequest;
		setChannelCreateRequest(channelCreateRequest : ChannelCreateRequest): void;
		channel_list_request?: ChannelListRequest;
		getChannelListRequest() : ChannelListRequest;
		setChannelListRequest(channelListRequest : ChannelListRequest): void;
		error?: Error;
		getError() : Error;
		setError(error : Error): void;
		login_response?: LoginResponse;
		getLoginResponse() : LoginResponse;
		setLoginResponse(loginResponse : LoginResponse): void;
		post_response?: PostResponse;
		getPostResponse() : PostResponse;
		setPostResponse(postResponse : PostResponse): void;
		fetch_response?: FetchResponse;
		getFetchResponse() : FetchResponse;
		setFetchResponse(fetchResponse : FetchResponse): void;
		read_response?: ReadResponse;
		getReadResponse() : ReadResponse;
		setReadResponse(readResponse : ReadResponse): void;
		enter_topic_response?: EnterTopicResponse;
		getEnterTopicResponse() : EnterTopicResponse;
		setEnterTopicResponse(enterTopicResponse : EnterTopicResponse): void;
		exit_topic_response?: ExitTopicResponse;
		getExitTopicResponse() : ExitTopicResponse;
		setExitTopicResponse(exitTopicResponse : ExitTopicResponse): void;
		ping_response?: PingResponse;
		getPingResponse() : PingResponse;
		setPingResponse(pingResponse : PingResponse): void;
		rescue_response?: RescueResponse;
		getRescueResponse() : RescueResponse;
		setRescueResponse(rescueResponse : RescueResponse): void;
		channel_create_response?: ChannelCreateResponse;
		getChannelCreateResponse() : ChannelCreateResponse;
		setChannelCreateResponse(channelCreateResponse : ChannelCreateResponse): void;
		channel_list_response?: ChannelListResponse;
		getChannelListResponse() : ChannelListResponse;
		setChannelListResponse(channelListResponse : ChannelListResponse): void;
		post_notify?: Post;
		getPostNotify() : Post;
		setPostNotify(postNotify : Post): void;
		
	}
	
	export interface PayloadBuilder {
		new(): Payload;
		decode(buffer: ArrayBuffer) : Payload;
		//decode(buffer: NodeBuffer) : Payload;
		//decode(buffer: ByteArrayBuffer) : Payload;
		decode64(buffer: string) : Payload;
		Type: Payload.Type;
		
	}	
}

declare module Proto2TypeScript.ChannerProto.Payload {
	export const enum Type {
		Unknown = 0,
		LoginRequest = 1,
		PostRequest = 2,
		FetchRequest = 3,
		ReadRequest = 4,
		EnterTopicRequest = 5,
		ExitTopicRequest = 6,
		PingRequest = 7,
		RescueRequest = 8,
		ChannelCreateRequest = 9,
		ChannelListRequest = 10,
		LoginResponse = 31,
		PostResponse = 32,
		FetchResponse = 33,
		ReadResponse = 34,
		EnterTopicResponse = 35,
		ExitTopicResponse = 36,
		PingResponse = 37,
		RescueResponse = 38,
		ChannelCreateResponse = 39,
		ChannelListResponse = 40,
		PostNotify = 61,
		Error = 101,
		
	}
}
