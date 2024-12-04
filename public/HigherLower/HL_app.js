const apiUrl = "https://pokeapi.co/api/v2/pokemon/";


//Used attributes: name, images, stats, height, weight, ID und cries
// number of pokémon in the api
const maxPokemonId = 1025;

const pokemon1Img = document.getElementById("pokemon1-img");
const pokemon1Name = document.getElementById("pokemon1-name");
const pokemon1Stat = document.getElementById("pokemon1-stat");
const pokemon2Img = document.getElementById("pokemon2-img");
const pokemon2Name = document.getElementById("pokemon2-name");
const pokemon2Stat = document.getElementById("pokemon2-stat");
const resultText = document.getElementById("result");
const scoreElement = document.getElementById("score");
const buttonSound = new Audio('./sounds/pokemonbutton.mp3');
const highScoreElement = document.getElementById("high-score");
const themeToggle = document.getElementById('themeToggle');

let useShiny = false;
let displayMode = 'sprite';
let pokemon1Data, pokemon2Data, statToCompare;
let score = 0;
let highScore = localStorage.getItem("highScore") || 0;


async function fetchRandomPokemon() {
    const randomId = Math.floor(Math.random() * maxPokemonId) + 1;
    const response = await fetch(`${apiUrl}${randomId}`);
    return response.json();
}

async function startGame() {
    pokemon1Data = await fetchRandomPokemon();
    pokemon2Data = await fetchRandomPokemon();

    const stats = ["hp", "attack", "defense", "special-attack", "special-defense", "speed", "weight", "height"];
    const statNames = {
        "hp": "HP (Lebenspunkte)-Wert",
        "attack": "Angriff-Wert",
        "defense": "Verteidigungs-Wert",
        "special-attack": "Spezial-Angriff-Wert",
        "special-defense": "Spezial-Verteidigungs-Wert",
        "speed": "Initiative-Wert",
        "weight": "Gewicht",
        "height": "Größe"
    };

    statToCompare = stats[Math.floor(Math.random() * stats.length)];

    if (["weight"].includes(statToCompare)) {
        resultText.textContent = `Welches Pokémon hat das höhere ${statNames[statToCompare]}?`;
    } else if (["height"].includes(statToCompare)) {
        resultText.textContent = `Welches Pokémon hat die höhere ${statNames[statToCompare]}?`;
    } else {
        resultText.textContent = `Welches Pokémon hat den höheren ${statNames[statToCompare]}?`;
    }


    updatePokemonImages();
    pokemon1Name.textContent = pokemon1Data.name.toUpperCase();
    pokemon2Name.textContent = pokemon2Data.name.toUpperCase();
    pokemon1Stat.textContent = "?";
    pokemon2Stat.textContent = "?";


    document.getElementById("choose-pokemon1").disabled = false;
    document.getElementById("choose-pokemon2").disabled = false;


    scoreElement.textContent = `Score: ${score}`;
}

function updatePokemonImages() {
    if (displayMode === 'artwork') {
        pokemon1Img.src = useShiny ? pokemon1Data.sprites.other['official-artwork'].front_shiny : pokemon1Data.sprites.other['official-artwork'].front_default;
        pokemon2Img.src = useShiny ? pokemon2Data.sprites.other['official-artwork'].front_shiny : pokemon2Data.sprites.other['official-artwork'].front_default;
    } else if (displayMode === 'showdown') {
        updateShowdownSprites(pokemon1Data, pokemon1Img);
        updateShowdownSprites(pokemon2Data, pokemon2Img);
    } else {
        pokemon1Img.src = useShiny ? pokemon1Data.sprites.front_shiny : pokemon1Data.sprites.front_default;
        pokemon2Img.src = useShiny ? pokemon2Data.sprites.front_shiny : pokemon2Data.sprites.front_default;
    }
}

function updateShowdownSprites(pokemonData, imgElement) {
    const showdownUrl = useShiny ?
        `https://play.pokemonshowdown.com/sprites/xyani-shiny/${pokemonData.name}.gif` :
        `https://play.pokemonshowdown.com/sprites/xyani/${pokemonData.name}.gif`;

    imgElement.onerror = function () {
        // fallback to static sprite if animated sprite does not exist
        imgElement.src = useShiny ? pokemonData.sprites.front_shiny : pokemonData.sprites.front_default;
    };

    imgElement.src = showdownUrl;
}

async function playPokemonCry(pokemonData) {
    const legacyCryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/${pokemonData.id}.ogg`;
    const latestCryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonData.id}.ogg`;
    try {
        const response = await fetch(legacyCryUrl, {method: 'HEAD'});
        // fallback to latest cry if legacy cry does not exist
        const cryUrl = response.ok ? legacyCryUrl : latestCryUrl;
        const audio = new Audio(cryUrl);
        audio.play();
    } catch (error) {
        console.error("Fehler beim Laden des Schreies:", error);
    }
}

function checkWinner(selectedPokemon) {
    let statValue1, statValue2;


    if (statToCompare === 'weight' || statToCompare === 'height') {
        statValue1 = pokemon1Data[statToCompare] / 10;
        statValue2 = pokemon2Data[statToCompare] / 10;
    } else {
        statValue1 = getStatValue(pokemon1Data, statToCompare);
        statValue2 = getStatValue(pokemon2Data, statToCompare);
    }


    pokemon1Stat.textContent = getStatValue(pokemon1Data, statToCompare);
    pokemon2Stat.textContent = getStatValue(pokemon2Data, statToCompare);

    let winner;


    if (statValue1 > statValue2) {
        winner = "pokemon1";
    } else if (statValue2 > statValue1) {
        winner = "pokemon2";
    } else {
        winner = "draw";
    }


    if (selectedPokemon === "pokemon1") {
        playPokemonCry(pokemon1Data);
    } else if (selectedPokemon === "pokemon2") {
        playPokemonCry(pokemon2Data);
    }


    if (winner === "draw") {
        resultText.textContent = "Unentschieden! Glück gehabt!";
        resultText.classList.add("draw-message");
        document.getElementById("choose-pokemon1").disabled = true;
        document.getElementById("choose-pokemon2").disabled = true;
        setTimeout(() => {
            resultText.classList.remove("draw-message");
            startGame();
        }, 2500);
    } else if ((selectedPokemon === "pokemon1" && winner === "pokemon1") ||
        (selectedPokemon === "pokemon2" && winner === "pokemon2")) {
        score += 1;
        resultText.textContent = "Richtig!";
        document.getElementById("choose-pokemon1").disabled = true;
        document.getElementById("choose-pokemon2").disabled = true;
        scoreElement.textContent = `Score: ${score}`;
        setTimeout(startGame, 2500);
    } else {
        if (score > highScore) {
            updateHighScore();
            showGameOverScreen(true);
        } else {
            showGameOverScreen(false);
        }
        score = 0;
        resultText.textContent = "Falsch!";
        scoreElement.textContent = `Score: ${score}`;
        document.getElementById("choose-pokemon1").disabled = true;
        document.getElementById("choose-pokemon2").disabled = true;
    }
}

function resetGame() {
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    startGame();
}

function getStatValue(pokemon, statName) {
    if (statName === 'weight') {
        return (pokemon.weight / 10).toFixed(1) + ' kg';
    } else if (statName === 'height') {
        return (pokemon.height / 10).toFixed(1) + ' m';
    } else {
        const statObj = pokemon.stats.find((stat) => stat.stat.name === statName);
        return statObj ? statObj.base_stat : null;
    }
}

function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem("highScore", highScore);
        highScoreElement.textContent = `Highscore: ${highScore}`;
    }
}

function playButtonSound() {
    buttonSound.play();
}

async function showGameOverScreen(isHighscore) {
    const existingOverlays = document.querySelectorAll('.game-over-overlay');
    existingOverlays.forEach(overlay => document.body.removeChild(overlay));

    const overlay = document.createElement("div");
    overlay.className = "game-over-overlay";

    const message = document.createElement("h2");
    message.className = "game-over-message";
    message.textContent = isHighscore ? "Schade!" : "Leider falsch!";

    const scoreMessage = document.createElement("p");
    scoreMessage.className = "game-over-score";
    scoreMessage.textContent = isHighscore ? `Neuer Highscore: ${highScore}` : `Bisheriger Highscore: ${highScore}`;

    const newGameBtn = document.createElement("button");
    newGameBtn.className = "new-game-button";
    newGameBtn.textContent = "Neues Spiel starten?";

    overlay.appendChild(message);
    overlay.appendChild(scoreMessage);
    overlay.appendChild(newGameBtn);
    document.body.appendChild(overlay);

    newGameBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
        startGame();
    });
}


function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.src = './img/light.png';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.src = './img/dark.png';
    }
}


themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        themeToggle.src = './img/light.png';
        localStorage.setItem('theme', 'dark');
    } else {
        themeToggle.src = './img/dark.png';
        localStorage.setItem('theme', 'light');
    }
});

highScoreElement.textContent = `Highscore: ${highScore}`;
pokemon1Img.addEventListener("click", () => playPokemonCry(pokemon1Data));
pokemon2Img.addEventListener("click", () => playPokemonCry(pokemon2Data));
document.getElementById("toggle-shiny").addEventListener("click", () => {
    useShiny = !useShiny;
    updatePokemonImages();
    document.getElementById("toggle-shiny").textContent = useShiny ? "Normal" : "Shiny";
});
document.getElementById("toggle-display").addEventListener("click", () => {
    if (displayMode === 'sprite') {
        displayMode = 'artwork';
        document.getElementById("toggle-display").textContent = "Showdown";
    } else if (displayMode === 'artwork') {
        displayMode = 'showdown';
        document.getElementById("toggle-display").textContent = "Sprites";
    } else {
        displayMode = 'sprite';
        document.getElementById("toggle-display").textContent = "Artwork";
    }
    updatePokemonImages();
});
document.getElementById("play-again").addEventListener("click", playButtonSound);
document.getElementById("choose-pokemon1").addEventListener("click", () => checkWinner("pokemon1"));
document.getElementById("choose-pokemon2").addEventListener("click", () => checkWinner("pokemon2"));
document.getElementById("play-again").addEventListener("click", resetGame);


loadTheme();
startGame();
