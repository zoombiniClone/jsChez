const Logic = require('logic-solver');


const Menu = {
    0: "Drink",
    1: "Dish",
    2: "Dessert",
};
const Drink = {
    0: "Milk",
    1: "Coffee",
    2: "OrangeJuice",
};
const Dish = {
    0: "Salad",
    1: "Sandwich",
    2: "Fish",
};
const Dessert = {
    0: "Watermelon",
    1: "Icecream",
    2: "Fruitpie",
};

const RuleType = {
    0: "Like",
    1: "Hate",
};
const Who = {
    0: "Me",
    1: "Other",
    2: "Neighbiors",
    3: "Leftside",
    4: "Rightside",
    5: "Everybody",
    6: "Edge",
};

function printPeople(people) {
    people.forEach(({ drink, dish, dessert }) => {
        console.log(`${Drink[drink]}, ${Dish[dish]}, ${Dessert[dessert]}`);
    });
    console.log();
}

function printRules(rules) {
    getFoodName = (menu) => {
        switch (menu.type) {
            case 0:  // Drink
                return Drink[menu.food];
            case 1:  // Dish
                return Dish[menu.food];
            case 2:  // Dessert
                return Dessert[menu.food];
        }
    }

    rules.forEach(({ type, target, menu }) => {
        const { index, who } = target;
        console.log(`${index}: ${Who[who]}, ${RuleType[type]}, ${getFoodName(menu)}`);
    });
}

function getTargetIndexes(target, count) {
    const { index, who } = target;

    const peopleList = [];

    for (let i=0;i<count;i++) {
        peopleList.push(i);
    }

    switch (who) {
        case 0:  // Me
            return [index];
        case 1:  // Other
            return peopleList.filter((value) => value !== index);
        case 2:  // Neighbiors
            return peopleList.filter((value) => value-1 === index || value+1 === index);
        case 3:  // Leftside
            return peopleList.filter((value) => value > index);
        case 4:  // Rightside
            return peopleList.filter((value) => value < index);
        case 5:  // Everybody
            return peopleList;
        case 6:
            return [0, count-1];
    }
}

function getPeopleTarget(people, target) {
    return getTargetIndexes(target, people.length).map((index) => people[index]);
}

function checkRule(people, rule) {
    const { target, menu } = rule;

    checkFood = (person) => {
        const { drink, dish, dessert } = person;
        switch (menu.type) {
            case 0:  // Drink
                return menu.food === drink;
            case 1:  // Dish
                return menu.food === dish;
            case 2:  // Dessert
                return menu.food === dessert;
        }
    }

    if (rule.type === 0) {
        return getPeopleTarget(people, target).every((person) => checkFood(person));
    } else if (rule.type === 1) {
        return getPeopleTarget(people, target).every((person) => !checkFood(person));
    }
    return false;
}

function getAllRules(count) {
    getIndexWho = (index) => {
        if (index === 0) 
            return [0, 1, 4, 5, 6];
        if (index === count-1) 
            return [0, 1, 3, 5, 6];
        return [0, 1, 2, 3, 4, 5, 6];
    }

    getIndexRules = (index) => {
        let rules = [];
        const ruleTypes = [0, 1];  // Like, Hate

        ruleTypes.forEach((type) => {
            getIndexWho(index).forEach((target) => {
                [0, 1, 2].forEach((menuType) => {
                    [0, 1, 2].forEach((foodType) => {
                        rules.push({
                            type,
                            target: {
                                index,
                                who: target
                            },
                            menu: {
                                type: menuType,
                                food: foodType
                            }
                        });
                    });
                });
            });
        });

        return rules;
    }

    let rules = [];

    for (let i=0;i<count;i++) {
        getIndexRules(i).forEach((rule) => {
            rules.push(rule);
        });
    }

    return rules;
}

function generateRules(people) {
    return getAllRules(people.length).filter((rule) => checkRule(people, rule));
}

function getPeople(count) {
    let people = [];

    for (let i=0;i<count;i++) {
        people.push({
            drink: Math.floor(Math.random() * 3),
            dish: Math.floor(Math.random() * 3),
            dessert: Math.floor(Math.random() * 3),
        });
    }

    return people;
}

function solve(count, rules) {
    let solver = new Logic.Solver();

    let people = [];

    const min = Logic.constantBits(0);
    const max = Logic.constantBits(2);

    for (let i=0;i<count;i++) {

        people.push([null, null, null]);

        for (let j=0;j<3;j++) {
            people[i][j] = Logic.variableBits(`people${i}${j}`, 2);
            solver.require(Logic.greaterThanOrEqual(people[i][j], min));
            solver.require(Logic.lessThanOrEqual(people[i][j], max));
        }
    }

    /* 
    {
        type,
        target: {
            index,
            who
        },
        menu: {
            type,
            food
        }
    }
    */
    rules.forEach(function (rule) {
        getTargetIndexes(rule.target, count).forEach((index) => {
            switch (rule.type) {
                case 0:
                    solver.require(Logic.equalBits(people[index][rule.menu.type], Logic.constantBits(rule.menu.food)));
                    break;
                case 1:
                    solver.forbid(Logic.equalBits(people[index][rule.menu.type], Logic.constantBits(rule.menu.food)));
                    break;
                default:
                    console.error("rule type error");
                    break;
            }
        });
    });


    let allSolutions = [];
    let curSolution = null;

    while ((curSolution = solver.solve())) {
        allSolutions.push(curSolution);
        solver.forbid(curSolution.getFormula());
    }

    return allSolutions.map((sol) => {
        return people.map((person) => {
            return {
                drink: sol.evaluate(person[0]),
                dish: sol.evaluate(person[1]),
                dessert: sol.evaluate(person[2])
            };
        });
    });
}

function shuffleList(list) {
    let clone = list.slice();
    clone.sort(() => Math.random() - 0.5);
    return clone;
}

function deleteList(list, index) {
    let clone = list.slice();
    clone.splice(index, 1);
    return clone;
}

function getGame(count) {
    const people = getPeople(count);  // 좋아하는 메뉴가 정해진 플레이어들을 가져온다
    printPeople(people);
    let rules = generateRules(people);  // 주어진 사람들이 가질 수 있는 모든 규칙들을 가져온다
    // printRules(rules);

    while (1) {
        let index = Math.floor(Math.random() * rules.length);
        let removedRules = deleteList(rules, index);
        const solutionPeoples = solve(count, removedRules);

        // solutionPeoples.forEach((people) => {
        //     printPeople(people);
        // });

        if (solutionPeoples.length > 1) {
            while (1) {
                let isFinish = true;

                rules = shuffleList(rules);

                for (let i=0;i<rules.length;i++) {
                    let removedRules = deleteList(rules, i);

                    if (solve(count, removedRules).length == 1) {
                        rules = removedRules;
                        isFinish = false;
                        break;
                    }
                }

                if (isFinish) break;
            }

            console.log();

            rules.sort((a, b) => {
                return a.target.index - b.target.index;
            });

            printRules(rules);
            break;
        }

        rules = removedRules;
    }
}

getGame(6);