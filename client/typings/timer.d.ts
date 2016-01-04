export interface Task {
    (now: number): any;
}
export declare class Timer {
    private tasks;
    private handle;
    static now(): number;
    constructor();
    add: (t: Task) => void;
    remove: (t: Task) => void;
    start: (msec: number) => void;
    stop: () => void;
    private tick;
}
