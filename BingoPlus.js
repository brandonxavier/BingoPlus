/**
 * Created with JetBrains WebStorm
 * User: brandonxavier(brandonxavier421@gmail.com)
 * Date: ${DATE}
 *

 Copyright 2013 Brandon Xavier (brandonxavier421@gmail.com)

 This file is part of ${PRODUCT_NAME}.

 ${PRODUCT_NAME} is free software: you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

 ${PRODUCT_NAME} is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with ${PRODUCT_NAME}.  If not, see <http://www.gnu.org/licenses/>.

 */


// var mycard = new ObjBingoCard;

// Vars

var freeSquare = false;

var game;
// game = new ObjBingoGame(1, false);


var tipCount = 0;
var tipKing = "";
var tipHigh = 0;


cb.settings_choices = [
    { name: 'minTip', type: 'int', minValue: 1, defaultValue: 5, label: 'Minimum tip to play Bingo'},
    {name: 'numCards', type: 'int', minValue: 1, defaultValue: 2,
        label: 'Number of Cards To Use (1 = 43.5 avg, 4 = 33.6 avg)'},
    {name: 'haveFreeSquare', type: 'choice', choice1: 'Yes', choice2: 'No', defaultValue: 'No',
        label: 'Is center square a free space?'},
    {name: 'bingoReward', type: 'str', minLength: 1, maxLength: 255, label: 'Reward for getting a Bingo'},
    {name: 'fallbackCount', type: 'int', minValue: 1, label: 'Topic Count'},
    {name: 'fallbackReward', type: 'str', minLength: 0, maxLength: 255, 'required': false,
        label: 'Reward for count (leave blank for same as Bingo)'}
];


// Callbacks
cb.onDrawPanel(function (user) {

        var v1, v3;

        if ( game.gameOver == true )
            v1 = "SHOWTIME";
        else
            v1 =  ( cb.settings.minTip != 1 ? cb.settings.minTip : 'ANY');

        if (tipCount <=0 )
            v3 = "SHOWTIME";
        else
            v3 = tipCount;

        return {'template': '3_rows_of_labels',
            'row1_label': 'Bingo Minimum Tip:',
            'row1_value': v1,
            'row2_label': "Highest Tipper: ",
            'row2_value': tipKing + "(" + tipHigh + ")",
            'row3_label': "Remaining count:",
            'row3_value': v3
        };
    }
);

cb.onTip(function (tip) {

    var tipAmount = parseInt(tip['amount']);

    // Bingo code
    if (game.gameOver == false && tipAmount >= cb.settings.minTip) {
        var drawn = game.drawNumber();
        cb.chatNotice(tip['from_user'] + " has drawn number " + drawn);
        game.checkCards(drawn);

        game.makeDisplayableGame();
        cb.chatNotice(game.displayableGame.join("\n"));
        game.checkForBingos();
        cb.drawPanel();
    }

    // Tip King code
    tipCount = tipCount - tipAmount;
    if (tipCount < 0)
        tipCount = 0;
    if (tipAmount > tipHigh) {
        tipKing = tip['from_user'];
        tipHigh = tipAmount;
    }


    // Update Displays
    cb.changeRoomSubject(formatTopic());
    cb.drawPanel();


});

cb.onMessage(function (msg) {

        var incoming = msg['m'].toUpperCase();


        if (tipKing != "") {
            if (tipKing == msg['user'])
                msg['background'] = "#9F9";
        }

        // Regular user commands

        if (incoming == "/DRAWN" || incoming == "/PICKED") {
            cb.chatNotice("Already drawn numbers: " + game.picked, msg['user']);
            msg['X-Spam'] = true;
        }
        if (incoming == "/CARDS") {
            cb.chatNotice(game.displayableGame.join("\n"), msg['user']);
            msg['X-Spam'] = true;
        }
        if (incoming == "/RULES") {
            showRules(msg['user']);
            msg['X-Spam'] = true;
        }

        // Model Only Commands
        if (msg['user'] == cb.room_slug) {

            if (incoming == "/EXTRA") {
                var drawn = game.drawNumber();
                cb.chatNotice(cb.room_slug + " has given the room a free play! Say 'Thank You!'\n" +
                    cb.room_slug + " has drawn number " + drawn);
                game.checkCards(drawn);
                game.makeDisplayableGame();
                cb.chatNotice(game.displayableGame.join("\n"));
                game.checkForBingos();
                cb.drawPanel();
                msg['X-Spam'] = true;
            }
            if (incoming == "/RESETBINGO") {
                startBingo();
                msg['X-Spam'] = true;
            }
            if (incoming.indexOf("/RESETBINGOMIN ") == 0 ) {
                if (msg['m'].length > 14 ) {
                    cb.settings.minTip = msg['m'].substring(15);
                    cb.changeRoomSubject(formatTopic());
                    cb.drawPanel();
                }
                msg['X-Spam'] = true;
            }
            if (incoming.indexOf("/RESETBINGOTOPIC ") == 0 ) {
                if (msg['m'].length >= 18 ) {
                    cb.settings.bingoReward = msg['m'].substring(17);
                    cb.changeRoomSubject(formatTopic());
                }
                msg['X-Spam'] = true;
            }
            if ((incoming.indexOf("/RESETCOUNT ") == 0) ||
                (incoming == "/RESETCOUNT") )   {
                if ( msg['m'].length > 11 )
                    cb.settings.fallbackCount = parseInt(msg['m'].substring(12));
                startTipKing();
                cb.drawPanel();
                cb.changeRoomSubject(formatTopic());
                msg['X-Spam'] = true;
            }
            if (incoming == "/RESETCOUNTTOPIC" ) {
                cb.settings.fallbackReward = "";
                cb.changeRoomSubject(formatTopic());
                msg['X-Spam'] = true;
            }
            if (incoming.indexOf("/RESETCOUNTTOPIC ") == 0 ) {
                if (msg['m'].length >= 18 ) {
                    cb.settings.fallbackReward = msg['m'].substring(17);
                    cb.changeRoomSubject(formatTopic());
                }
                msg['X-Spam'] = true;
            }
            if (incoming == "/SHOWCARDS") {
                cb.chatNotice(game.displayableGame.join("\n"));
                msg['X-Spam'] = true;
            }
            if (incoming == "/SHOWRULES") {
                showRules();
                msg['X-Spam'] = true;
            }
        }
        else
            if (incoming.substring(0,1) == "/")  // Any other /commands are spam
                msg['X-Spam'] = true ;

        return msg;
    }
);
// Helpers
function pad(n) {
    return ( n < 10 ) ? ( "0" + n ) : n;
}

function formatTopic() {

    // Initial string
    var s = "Play BINGO ";

    // Add the bingoReward
    s = s + cb.settings.bingoReward + " ";

    // Put in the minimum tip
    if (cb.settings.minTip == 1)
        s = s + "(Tip ANYTHING to play) ";
    else
        s = s + "(min tip = " + cb.settings.minTip + ") ";

    // Add the count verbiage
    s = s + "OR Tip " + cb.settings.fallbackCount + " [" + tipCount + " remaining] ";

    // If there's a fallback reward, tag it on
    if (cb.settings.fallbackReward != "") {
        s = s + " " + cb.settings.fallbackReward;
    }

    return s;
}

function showRules(toWhom) {

    userRules = "\nBingo Plus:\n\n" +
        "The easiest game EVER! All you have to do is TIP!\n\n" +
        "If your tip meets the minimum to play, a bingo number\n" +
        "will be RANDOMLY drawn (just as though you were the bingo caller) \n" +
        "and checked against the model's bingo card(s). \n\n" +
        "Additionally, EVERY tip also goes towards a show count!\n\n" +
        "User commands:\n" +
        "/drawn = Show numbers already drawn\n" +
        "/cards = Show current cards\n" +
        "/rules = This help message\n\n";
    modelRules = "Model-only commands:\n" +
        "/extra = Draw an extra number without a tip\n" +
        "/resetbingo = Reset bingo cards\n" +
        "/resetbingotopic newtopic = reset bingo topic to 'newtopic'" +
        "/resetbingomin n = reset min bingo tip to n" +
        "/resetcount n = Reset count to n\n" +
        "/resetcounttopic newtopic = Reset count topic to 'newtopic'" +
        "/showcards = Show cards to EVERYBODY\n" +
        "/showrules = Show rules to EVERYBODY\n\n";

    if (toWhom == null) {
        cb.chatNotice(userRules);
    }
    else {
        if (toWhom != cb.room_slug) {
            cb.chatNotice(userRules, toWhom);
        }
        else {
            cb.chatNotice(userRules + modelRules, toWhom);
        }
    }

}

function Init() {


    showRules();

    startBingo();
    startTipKing();

    cb.changeRoomSubject(formatTopic());
    cb.drawPanel();

}

function startBingo(){

    if (cb.settings.haveFreeSquare == "Yes")
        freeSquare = true;
    game = new ObjBingoGame(cb.settings.numCards, freeSquare);
    game.makeDisplayableGame();
    cb.chatNotice(game.displayableGame.join("\n"));

}

function startTipKing(){

    tipCount = cb.settings.fallbackCount;
    tipKing = "";
    tipHigh = 0;

}
// Init
Init();


// Objects

function ObjBingoCard() {

    this.card = new Array(26);
    this.displayable = [ " ", "|", "|", "|", "|", "|", " "];


    // Methods
    this.populateCard = populateCard;
    this.checkBingo = checkBingo;
    this.checkNumber = checkNumber;
    this.makeDisplayable = makeDisplayable;
    this.dupCheck = dupCheck;


    function checkBingo() {

        var x;

        // Check for diagonals first
        if ((this.card[1] == -1 &&
            this.card[7] == -1 &&
            this.card[13] == -1 &&
            this.card[19] == -1 &&
            this.card[25] == -1 ) ||
            (this.card[21] == -1 &&
                this.card[17] == -1 &&
                this.card[13] == -1 &&
                this.card[9] == -1 &&
                this.card[5] == -1 ))
            return true;
        // Check for horizontals
        for (x = 1; x <= 5; x++) {
            if (this.card[x] == -1 &&
                this.card[x + 5] == -1 &&
                this.card[x + 10] == -1 &&
                this.card[x + 15] == -1 &&
                this.card[x + 20] == -1)
                return true;
        }
        // Check for verticals
        for (x = 1; x <= 21; x = x + 5) {
            if (this.card[x] == -1 &&
                this.card[x + 1] == -1 &&
                this.card[x + 2] == -1 &&
                this.card[x + 3] == -1 &&
                this.card[x + 4] == -1)
                return true;
        }

        return false;
    }


    function populateCard(hasFreeSquare) {

        var tgt;

        for (var i = 1; i <= 5; i++) {
            var colTop = (i * 15) - 14;
            var colBottom = i * 15;
            for (var j = 1; j <= 5; j++) {

                tgt = ( i - 1 ) * 5 + j;

                do {
                    this.card[tgt] = Math.floor(((Math.random() * (colBottom - colTop + 1)) + colTop ));
                }
                while (this.dupCheck((i * 5) - 4, tgt) == false) ;

                // print("Square= " + tgt +" " + this.card[tgt]);
            }

        }

        if (hasFreeSquare) {
            this.card[13] = -1;
        }

        this.makeDisplayable();

    }

    function makeDisplayable() {

        var str, tgt;

        this.displayable = [ "", "|", "|", "|", "|", "|", ""];
        for (var i = 1; i <= 5; i++) {
            for (var j = 1; j <= 5; j++) {
                tgt = ((i - 1) * 5) + j;
                if (this.card[tgt] == -1) {
                    str = " XX";
                }
                else {
                    str = " " + pad(this.card[tgt]);

                }
                this.displayable[j] = this.displayable[j] + str;
            }
        }
    }

    function checkNumber(number) {

        for (var i = 1; i <= this.card.length; i++) {
            if (this.card[i] == number) {
                this.card[i] = -1;
                this.makeDisplayable();
            }

        }
    }

    function dupCheck(min, max) {

        return this.card.slice((min), max).indexOf(this.card[max]) == -1;

    }
} // ObjBingoCard

function ObjBingoGame(numCards, hasFreeSquare) {

    this.cards = [];
    for (var x = 0; x < numCards; x++) {
        this.cards[x] = new ObjBingoCard();
        this.cards[x].populateCard(hasFreeSquare);
        this.cards[x].makeDisplayable();
    }

    this.unpicked = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
        31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
        51, 52, 53, 54, 55, 56, 57, 58, 59, 60,
        61, 62, 63, 64, 65, 66, 67, 68, 69, 70,
        71, 72, 73, 74, 75
    ];

    this.gameOver = false;
    this.picked = [];
    this.displayableGame = ["", "", "", "", "", "", ""];
    this.drawNumber = drawNumber;
    this.makeDisplayableGame = makeGameDisplayable;
    this.checkCards = checkCards;
    this.checkForBingos = checkForBingos;

    function checkForBingos() {

        var retval = false;

        for (var a = 0; a < this.cards.length; a++) {
            if (this.cards[a].checkBingo()) {
                cb.chatNotice("BINGO on Card " + (a + 1) + "!!!");
                game.gameOver = true;
                retval = true;
            }
        }

        return retval;

    }

    function checkCards(number) {

        for (var a = 0; a < this.cards.length; a++) {
            this.cards[a].checkNumber(number);
        }
    }

    function makeGameDisplayable() {

        var header = " ------- Card ";
        var header2 = " -------";
        var trailer = "-------------------------";
        var trailer2 = "---------------------------------------------------";
        var currRow = -6;
        var irow;

        var n = 0;
        while (n < this.cards.length) {
            if (n % 2 == 0) {
                currRow += 6;
                this.displayableGame[currRow] = header + (n + 1) + header2; //fugly
                for (irow = 1; irow <= 5; irow++)
                    this.displayableGame[currRow + irow] = this.cards[n].displayable[irow] + " |";
            }
            else {
                for (irow = 0; irow <= 5; irow++) {
                    this.displayableGame[currRow + irow] =
                        this.displayableGame[currRow + irow].substr(0, this.displayableGame[currRow + irow].length - 1);
                }
                this.displayableGame[currRow] = this.displayableGame[currRow] + header + (n + 1) + header2; //fugly
                for (irow = 1; irow <= 5; irow++)
                    this.displayableGame[currRow + irow] = this.displayableGame[currRow + irow] +
                        this.cards[n].displayable[irow] + " |";
            }
            n++;
        }
        if (this.cards.length % 2) {
            this.displayableGame[currRow + 6 ] = trailer;
            if (currRow > 0) {  // Trailer will be missing in right-hand column
                this.displayableGame[currRow] = this.displayableGame[currRow] + trailer.substr(1);
            }
        }
        else
            this.displayableGame[currRow + 6 ] = trailer2;


    }

    function drawNumber() {

        var num;

        num = this.unpicked[Math.floor(((Math.random() * this.unpicked.length - 1 ) + 1 ))];
        // if (num == null) print("null drawn " + this.unpicked.length);
        this.unpicked.splice(this.unpicked.indexOf(num), 1);
        game.picked.push(num);

        return num;
    }

}


