export interface Task {
	(now: number): any;
}
export class Timer {
	private tasks: Array<Task>;
	constructor() {
		this.tasks = new Array<Task>();
	}
	add = (t: Task) => {
		this.tasks.push(t);
	}
	remove = (t: Task) => {
		var idx = this.tasks.indexOf(t);
		if (idx >= 0) {
			this.tasks.splice(idx, 1);
		}
	}
	now = (): number => {
		return (new Date()).getTime();
	}
	start = (msec: number) => {
		setInterval(this.tick, msec);
	}
	private tick = () => {
		var nowms : number = this.now();
		for (var i in this.tasks) {
			this.tasks[i](nowms);
		}
	}
}
