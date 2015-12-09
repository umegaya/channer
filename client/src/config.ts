export class Config {
	url: string;
	response_timeout_ms: number;
	ping_interval_ms: number;
	deactivate_timeout_ms: number;
	timer_resolution_ms: number;
	constructor(src: any) {
		this.url = src.url;
		this.response_timeout_ms = src.response_timeout_ms || 5000;
		this.ping_interval_ms = src.ping_interval_ms || this.response_timeout_ms;
		this.deactivate_timeout_ms = src.deactivate_timeout_ms || 60000;
		this.timer_resolution_ms = src.timer_resolution_ms || 1000;
	}
}
