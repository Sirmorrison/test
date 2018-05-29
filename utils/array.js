Array.prototype.unique = function(mutate) {
    let unique = this.reduce(function(accum, current) {
        if (accum.indexOf(current) < 0) {
            accum.push(current);
        }
        return accum;
    }, []);
    if (mutate) {
        this.length = 0;
        for (let i = 0; i < unique.length; ++i) {
            this.push(unique[i]);
        }
        return this;
    }
    return unique;
};

exports.removeDuplicates = function (array) {
    //pass false keeps original array and return a new array with unique values
    return array.unique(true);
};