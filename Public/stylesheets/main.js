function getRandomString(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}
var roomindex =1;
var reviewindex = 0;
var waitingindex = 0;
function getRandomNumber(){
	return Math.floor(Math.random() * 1000);

}

module.exports.getRandomString=getRandomString;
module.exports.roomindex = roomindex;
module.exports.reviewindex =reviewindex;
module.exports.getRandomNumber = getRandomNumber;
module.exports.waitingindex = waitingindex;