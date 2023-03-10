var back = " #]"
var front = "[# "



figma.showUI(
    __html__, {
    width: 350,
    height: 420,
    title: "Sticky Tags"
},
)

var activeTags = getActiveTags()
figma.ui.postMessage({ tags: activeTags, msg: "init" })

// figma.ui.postMessage({ tags: activeTags, msg: "init" })

// Object.defineProperty(window, activeTags, {
//     get: function () {
//         console.log('get!');
//         return activeTags;
//     },
//     set: function (value) {
//         console.log('set!');
//         value_of_abc = value;
//         figma.ui.postMessage({ tags: activeTags, msg: "init" })

//     }
// });

// var activeTags = getActiveTags()



const loadFonts = async () => {

    await figma.loadFontAsync({ family: "Inter", style: "Medium" })
    await figma.loadFontAsync({ family: "Inter", style: "Bold" })
    await figma.loadFontAsync({ family: "Work Sans", style: "Bold" })

    console.log("Awaiting the fonts.")

}

// Print tags on all stickies
function getActiveTags() {
    console.log("Getting active tags!")
    let children = figma.currentPage.children
    let tags = []

    for (let i = 0; i < children.length; i++) {
        if (children[i].type === "SECTION") {
            var ancestors = getAncestorStickies(children[i], [])
            for (let j = 0; j < ancestors.length; j++) {
                if (ancestors[j].type === "STICKY") {
                    let temp_tags = ancestors[j].text.characters.split(front).filter(tag => tag.indexOf(back) > 0).map(tag => tag.split(back)[0].trim())
                    tags.push(...temp_tags)
                }
            }
        } else if (children[i].type === "STICKY") {
            let temp_tags = children[i].text.characters.split(front).filter(tag => tag.indexOf(back) > 0).map(tag => tag.split(back)[0].trim())
            // let temp_tags = children[i].text.characters.split(front).filter(tag => tag.endsWith(back) && tag.length > 3).map(tag => tag.slice(0, -3))
            tags.push(...temp_tags)
        }
    }

    return [...new Set(tags)]
}

// function displayActiveTags() {
//     var tagsList = document.querySelector("#tags");
//     // const tagsList = document.getElementById('tags')

//     tagsList.insertAdjacentHTML("beforeend", '<li id="grapes">Grapes</li>');
// }


function getAncestorStickies(parent, ancestors) {
    // Recursively get all Stickies in sections (and sections in sections etc.)
    for (let i = 0; i < parent.children.length; i++) {
        if (parent.children[i].type === "STICKY") {
            ancestors.push(parent.children[i])

        } else if (parent.children[i].type === "SECTION") {
            ancestors = getAncestorStickies(parent.children[i], ancestors)

        }
    }

    return ancestors
}

function getSelectedStickies(children) {
    var nodes = []

    // Add all selected Sticky Notes to nodes array
    for (let i = 0; i < children.length; i++) {
        if (children[i].type === "SECTION") {
            var ancestors = getAncestorStickies(children[i], [])
            for (let j = 0; j < ancestors.length; j++) {
                if (ancestors[j].type === "STICKY") {
                    nodes.push(ancestors[j])
                }
            }
        } else if (children[i].type === "STICKY") {
            nodes.push(children[i])

        }
    }

    return nodes
}


figma.ui.onmessage = msg => {

    var children
    var tag


    switch (msg.type) {
        case 'add-tag':
            tag = msg.tag
            children = figma.currentPage.selection
            const nodes = getSelectedStickies(children)


            loadFonts().then(() => {
                for (let i = 0; i < nodes.length; i++) {
                    // Add after a \n\n from last character
                    // Or add after the last existing tag
                    let curr = nodes[i].text.characters
                    let tag = `${front}${msg.tag.trim()}${back}`

                    if (curr.includes(tag)) {
                        // If tag is already on Note, don't duplicate
                        break
                    } else if (curr.includes(front) && curr.includes(back)) {
                        // Find last tag, place '\n + tag' after that
                        let lastOpen = curr.lastIndexOf(front)
                        let nextClose = curr.indexOf(back, lastOpen) + 3
                        nodes[i].text.characters = [curr.slice(0, nextClose), tag, curr.slice(nextClose)].join('');

                    } else if (curr.endsWith("\n\n")) {
                        nodes[i].text.characters = `${curr}${tag}`

                    } else if (curr.endsWith("\n")) {
                        nodes[i].text.characters = `${curr}\n${tag}`

                    } else {
                        nodes[i].text.characters = `${curr}\n\n${tag}`
                    }

                }

                console.log("DONE", children)

                activeTags = getActiveTags()
                figma.ui.postMessage({ tags: activeTags, msg: "init" })


                console.log(nodes)
                figma.currentPage.selection = nodes
                figma.viewport.scrollAndZoomIntoView(nodes)
            })

            break

        case 'check-selected':
            let message = "invalid"
            children = figma.currentPage.selection

            if (getSelectedStickies(children).length > 0) {
                message = "valid"
            }

            figma.ui.postMessage({ msg: message })

            break


        default:
            break
    }

    // if (msg.type === 'add-tag') {
    // }
    // // LEGACY
    // else if (msg.type === 'apply-all') {
    //     children = figma.currentPage.children
    // } else if (msg.type === 'apply-selected') {
    //     children = figma.currentPage.selection
    // }





};