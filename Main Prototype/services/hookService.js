exports.workWithHooks = function (hooks) {
    if(hooks.issue) {
        if(hooks.comment) {
            console.log("issue and comment created")
        } else {
            console.log("issue created")
        }
    }
};