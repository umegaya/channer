export interface Task {
    (now: number): any;
}
export declare class Timer {
    private tasks;
    constructor();
    add: (t: Task) => void;
    remove: (t: Task) => void;
    now: () => number;
    start: (msec: number) => void;
    private tick;
}
