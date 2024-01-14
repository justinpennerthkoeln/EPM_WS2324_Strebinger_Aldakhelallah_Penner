export function getHost(location) {
    if(location.includes('localhost')) {
        return 'ws://localhost:80';
    } else if(location.includes('87')) {
        return 'ws://87.186.28.104:3000/';
    } else {
        console.log("Could not determine host.")
    }
}

export function getHostHttp(location) {
    if(location.includes('localhost')) {
        return 'http://localhost:80/';
    } else if(location.includes('87')) {
        return 'http://87.186.28.104:3000/';
    } else {
        console.log("Could not determine host.")
    }
}