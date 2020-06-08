export function getPrevDate(date: Date): Date {
    return new Date(date.getTime() - 24 * 60 * 60 * 1000);
}

export function getNextDate(date: Date): Date {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

export function getDateTimeStringFromStamp(unix_timestamp: number): string {
    let date: Date = new Date(unix_timestamp * 1000);
    let day: string = "" + date.getDate();
    let month: string = "" + (date.getMonth()+1);
    let hours: string = "" + date.getHours();
    let minutes: string = "0" + date.getMinutes();
    let seconds: string = "0" + date.getSeconds();

    let formattedTime: string = day+ '/' + month +' '+hours + ':' + minutes.substr(-2);

    return formattedTime;
}

export function getDateStringFromStamp(unix_timestamp: number): string {
    let date: Date = new Date(unix_timestamp * 1000);
    let day: string = "" + date.getDate();
    let year: string = "" + date.getFullYear();
    let month: string = "" +(date.getMonth()+1)
    let formattedTime: string = year + '-' + month.toString().padStart(2,"0") + '-' + day.toString().padStart(2,"0");

    return formattedTime;
}

export function getToday(): Date {
    let date: Date = new Date();
    date = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    date.setHours(0);
    return date;
}

export function getDayLength(): number {
    return 24 * 60 * 60;
}

export function formatMetricHours(totalSeconds: number): number {
    return parseFloat((totalSeconds/60/60).toFixed(2));
}

export function formatMinutes(totalSeconds: number): string {
    let hours = Math.floor(totalSeconds / 60 / 60);
    let minutes = Math.floor((totalSeconds - hours * 60 * 60) / 60);
    let seconds = totalSeconds - hours * 60 * 60 - minutes * 60;

    return `${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2, "0")}`

    /*
    if (hours > 0) {
    } else if (minutes > 0) {
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    } else {
        return `00:${seconds.toString().padStart(2, "0")}`
    }
    */
}

export function formatSeconds(totalSeconds: number): string {
    let hours = Math.floor(totalSeconds / 60 / 60);
    let minutes = Math.floor((totalSeconds - hours * 60 * 60) / 60);
    let seconds = totalSeconds - hours * 60 * 60 - minutes * 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    } else if (minutes > 0) {
        return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    } else {
        return `00:${seconds.toString().padStart(2, "0")}`
    }
}

export function getDateWithNoTime(date: Date): Date {
    // Simplest but hacky way
    return new Date(date.toISOString().substr(0, 11) + "00:00:00.000Z");
}
