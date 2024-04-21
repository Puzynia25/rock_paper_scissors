const readline = require("readline");
const crypto = require("crypto");
const Table = require("cli-table");
const args = process.argv.slice(2);
const checkHmacUrl = "https://www.lddgo.net/en/encrypt/hmac";

function getProperArgs(props) {
    const uniqueArgs = [...new Set(props)];
    if (uniqueArgs.length < 3 || uniqueArgs.length % 2 === 0) {
        return null;
    }
    return uniqueArgs;
}

function availableMoves() {
    const moves = new Map();
    const properArgs = getProperArgs(args);
    if (properArgs) {
        properArgs.forEach((item, i) => {
            moves.set(i + 1, item);
        });
        return moves;
    } else {
        console.log(
            'Invalid arguments. Please provide an odd number (≥ 3) of distinct strings as moves (e.g. "Rock Paper Scissors" or "Rock Paper Scissors Lizard Spock").'
        );
        return null;
    }
}

function getSecretKey() {
    const keyLength = 32;
    const hexKey = crypto.randomBytes(keyLength).toString("hex");
    return hexKey;
}

function getHmac(key, pcMove, moves) {
    const hmac = crypto.createHmac("sha3-256", key);
    hmac.update(moves.get(pcMove));
    const hmacHex = hmac.digest("hex");
    console.log(`HMAC: ${hmacHex}`);
}

function createMenu(moves) {
    const menu = new Map(moves);
    menu.set(0, "exit").set("?", "help");
    return menu;
}

function createHelp(moves) {
    const header = ["v PC/User >"];
    const resultTable = [];
    const colWight = 13;
    const colWidths = [colWight];

    moves.forEach((move) => {
        header.push(move);
        colWidths.push(colWight);
    });

    moves.forEach((move, key) => {
        const row = [move];
        moves.forEach((user, userKey) => {
            const winString = determineWinner(key, userKey, moves, "Win", "Lose", "Draw");
            row.push(winString);
        });
        resultTable.push(row);
    });

    const table = new Table({
        head: header,
        colWidths: colWidths,
    });
    resultTable.forEach((row) => {
        table.push(row);
    });
    console.log(table.toString());
}

function outputMenu(obj) {
    console.log("Available moves:");
    obj.forEach((item, key) => {
        console.log(`${key} - ${item}`);
    });
}

function getPcMove(moves) {
    const min = 1;
    const max = moves.size;
    const pcMove = Math.floor(Math.random() * (max - min + 1)) + min;
    return pcMove;
}

function inputMove(pcMove, moves, secretKey, menu) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.prompt();
    rl.question("Enter your move: ", (answer) => {
        if (answer === "?") {
            createHelp(moves);
        }
        const userMove = parseInt(answer);
        rl.close();
        if (userMove === 0) return;
        if (isNaN(userMove) || !moves.has(userMove)) {
            reset(moves, menu);
        } else {
            console.log(`Your move: ${moves.get(userMove)}`);
            console.log(`Computer move: ${moves.get(pcMove)}`);
            console.log(
                determineWinner(pcMove, userMove, moves, "PC wins!", "You win!", "It's a tie!")
            );
            console.log(`HMAC key: ${secretKey}`);
            console.log(`To verify the HMAC, visit this link: ${checkHmacUrl}`);
        }
    });
}

function reset(moves, menu) {
    const newSecretKey = getSecretKey();
    const newPcMove = getPcMove(moves);
    getHmac(newSecretKey, newPcMove, moves);
    outputMenu(menu);
    inputMove(newPcMove, moves, newSecretKey, menu);
}

function determineWinner(pcMove, userMove, moves, pcWin, userWin, tie) {
    const a = pcMove - 1;
    const b = userMove - 1;
    const n = moves.size;
    const p = Math.floor(n / 2);
    const isWin = Math.sign(((a - b + p + n) % n) - p);

    switch (isWin) {
        case -1:
            return userWin;
        case 0:
            return tie;
        case 1:
            return pcWin;
    }
}

const currentMoves = availableMoves();
if (!currentMoves) return;
const currentMenu = createMenu(currentMoves);
reset(currentMoves, currentMenu);
