
let questions;
let current_question;
fetch("src/questions.json")
    .then(x => x.json())
    .then(x => questions = x);

let questions_done = [];
let current_level;
let current_score;

// if there's a score stored in local storage, retrieve it
if( localStorage.maths_taths_score ) {
    current_score = JSON.parse(
        localStorage.maths_taths_score
    );
} else {
    current_score = {
        per_level: {level_1: 0, level_2: 0, level_3: 0},
        total: 0
    };
}

// array of objects like {question: "1 + 1 = ?", correct = true}

const goto_page = div_id => {

    // hide all page divs
    Array.from(
        document.getElementsByClassName("fullscreen_div")
    ).map(element => element.style.display = 'none' );

    if( ["level_div","level_select"].includes(div_id) ) {
        document.getElementById("score").style.display = "inherit";
    }

    if( div_id == "level_div" ) {
        document.getElementById("go_to_level_select").style.display = "inherit";
    } else {
        document.getElementById("go_to_level_select").style.display = "none";
    }

    // reveal the target div
    document.getElementById(div_id).style.display = 'block';

}

document.getElementById("go_to_level_select")
    .addEventListener("click", () => goto_page("level_select"));

// draw a random element from an array
const draw_one_random = x => {
    const options = x.length;
    const to_use = Math.floor(Math.random() * Math.floor(options));
    return x[to_use];
}

// from https://stackoverflow.com/a/12646864
const shuffleArray = array => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const load_question = (level) => {

    // get a list of questions in this level
    const level_qs = questions.find(x => x.level == level).questions;

    // get a list of questions already answered
    const already_answered = questions_done
        .map(x => x.question);

    // get a list of questions in this level not yet answered
    const not_yet_answered = level_qs
        .filter(x => !already_answered.includes( x.question ));

    // get a list of questions previously answered wrong
    const prev_wrong = questions_done.filter(x => !x.correct).map(x => x.question);

    
    /*
        Initiate an object to hold a list of questions
        from which to draw.

        If there are questions the user hasn't answered yet
        draw from those first. Then try for questions the user
        has not answered correctly. If they've all been answered
        correctly, then just use the entire list, so they can
        keep answering them as many times as they want.
    */
   let questions_list;
    if( not_yet_answered.length > 0 ) {
        questions_list = not_yet_answered;
    } else if( prev_wrong.length > 0 ) {
        questions_list = questions
            .find(x => x.level == current_level).questions
            .filter(x => prev_wrong.includes(x.question));
    } else {
        questions_list = level_qs;
    }
        
    // choose a random question from that list
    current_question = draw_one_random( questions_list );

    // put the question text into the question element
    const container = Array.from(
            document.getElementById("level_div").childNodes )
        .find(x => x.className == "question_container");

    const textbox = Array.from( container.childNodes )
        .find(x => x.className == "question_text")
        .innerText = current_question.question;

    current_question.all_options =
        shuffleArray(
            [ current_question.correct_answer ]
            .concat( current_question.wrong_answers )
        );
    
    ["answer_1_text", "answer_2_text", "answer_3_text"]
            .map((x,i) => {
                const ans_el = document.getElementById(x);
                const answer = current_question.all_options[i];
                ans_el.innerText = answer;
                // ans_el.addEventListener("click", function() { check_answer(answer) });
            });
    
}

// going from the homepage to the level select page
document.getElementById("homepage-level_select")
    .addEventListener("click", () => goto_page("level_select"));

// going from the level_select page to one of the levels
document.getElementById("level_select-level_1")
    .addEventListener("click", () => {
        goto_page("level_div");
        current_level = 1;
        load_question(current_level);
    });
document.getElementById("level_select-level_2")
        .addEventListener("click", () => {
        goto_page("level_div");
        current_level = 2;
        load_question(current_level);
});
document.getElementById("level_select-level_3")
    .addEventListener("click", () => {
        goto_page("level_div");
        current_level = 3;
        load_question(current_level);
});


const check_answer = e => {

    // if the element is a p, take its text, if not, look for the p child
    const answer_text = e.target.localName == "p" ?
        e.target.innerText :
        Array.from(e.target.children).find(x => x.localName == "p").innerText;

    const correct = answer_text == '' + current_question.correct_answer;

    // add to the total score
    if(correct) {
        current_score.total++;
        current_score.per_level['level_' + current_level]++;
    } else {
        current_score.total--;
        current_score.per_level['level_' + current_level]--;
    }
    update_score();
    
    // show the tick or cross image
    const div_el = document.getElementById("tick_cross");
    const img_el = document.getElementById("tick_cross_img");

    img_el.src = correct ? "images/correct.png" : "images/incorrect.png";
    div_el.style.display = "inline-block";

    // add this question to the list of questions answered
    const already_answered = questions_done
        .map(x => x.question)
        .includes(current_question.question);
    
    const already_passed = already_answered ?
        questions_done.find(x => x.question == current_question.question).correct :
        false;

    if( !already_answered ) {
        questions_done.push({
            question: current_question.question,
            correct: correct
        });
    } else {
        questions_done
            .find(x => x.question == current_question.question)
            .correct = correct || already_passed
    }

    // after a delay, hide the tick or cross, and load another question
    setTimeout(() => {
        div_el.style.display = "none";
        load_question(current_level);
    }, 1000)
}

["answer_1", "answer_2", "answer_3"]
    .map(x => {
        document.getElementById(x)
            .addEventListener("click", check_answer);
    });

const update_score = async () => {
    const score = current_score.total;
    const score_el = document.getElementById("score_number");
    score_el.innerText = score;

    localStorage.setItem(
        "maths_taths_score",
        JSON.stringify( current_score )
    );
}
update_score();



// initialise a service worker
async function register_service_worker() {
    try {
        await navigator.serviceWorker
            .register('service_worker.js')
    } catch (e) {
        console.log("Service worker failed to register")
    }
}
if ('serviceWorker' in navigator) register_service_worker();
