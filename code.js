figma.showUI(
    __html__, {
    width: 350,
    height: 520,
    title: "Sticky Tags"
},
)

const colors = [{
    r: 1,
    g: 0.8509804010391235,
    b: 0.4000000059604645,
    name: "yellow"
},
{
    r: 0.5215686559677124,
    g: 0.8784313797950745,
    b: 0.6392157077789307,
    name: "green"
},
{
    r: 0.4588235318660736,
    g: 0.843137264251709,
    b: 0.9411764740943909,
    name: "teal"
},
{
    r: 0.686274528503418,
    g: 0.7372549176216125,
    b: 0.8117647171020508,
    name: "gray"
},
{
    r: 1,
    g: 0.686274528503418,
    b: 0.6392157077789307,
    name: "red"
},
{
    r: 1,
    g: 0.7686274647712708,
    b: 0.43921568989753723,
    name: "orange"
},
{
    r: 0.501960813999176,
    g: 0.7921568751335144,
    b: 1,
    name: "blue"
},
{
    r: 0.8509804010391235,
    g: 0.7215686440467834,
    b: 1,
    name: "violet"
},
{
    r: 1,
    g: 0.7411764860153198,
    b: 0.9490196108818054,
    name: "pink"
},
{
    r: 0.9019607901573181,
    g: 0.9019607901573181,
    b: 0.9019607901573181,
    name: "light-gray"
}

]


var back = figma.root.getPluginData("back") === '' ? " #]" : figma.root.getPluginData("back")
var front = figma.root.getPluginData("front") === '' ? "[# " : figma.root.getPluginData("front")
figma.ui.postMessage({ front: front, msg: "set-front" })
figma.ui.postMessage({ back: back, msg: "set-back" })

resetTags()

figma.on("selectionchange", () => { resetTags() })

var tagsWithStates

function resetTags() {
    tagsWithStates = getTagsStates(getActiveTags(), getSelectedStickies(figma.currentPage.selection))
    figma.ui.postMessage({ tags: tagsWithStates, msg: "init" })
}


const loadFonts = async () => {
    await figma.loadFontAsync({ family: "Inter", style: "Medium" })
    await figma.loadFontAsync({ family: "Inter", style: "Bold" })
    await figma.loadFontAsync({ family: "Work Sans", style: "Bold" })
}


function getActiveTags(children) {
    if (children == null) {
        children = figma.currentPage.children
    }
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
            tags.push(...temp_tags)
        }
    }

    return [...new Set(tags)].sort(function (a, b) {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    })
}


function getTagsStates(activeTags, nodes) {
    var tagsWithStates = []
    for (let i = 0; i < activeTags.length; i++) {
        let onSticky = true

        // Tags should all be unselected when no stickies are selected
        if (nodes.length == 0) {
            onSticky = false
        }

        for (let j = 0; j < nodes.length; j++) {
            if (!nodes[j].text.characters.includes(`${front}${activeTags[i]}${back}`)) {
                onSticky = false
                break
            }
        }

        tagsWithStates.push({ tagName: activeTags[i], onSticky: onSticky })
    }
    return tagsWithStates
}


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


function makeSections(sections) {
    let realSections = []
    let x
    let y

    // Create sections, and populate with Stickies
    for (let i = 0; i < sections.length; i++) {
        let section = figma.createSection()
        section.name = sections[i].title

        if (i == 0) {
            x = section.x
            y = section.y
        } else {
            section.x = x
            section.y = y
        }

        let rows = []
        let rowWidth = 4

        // Pre-fill rows array to determine height / width
        for (let j = 0; j < sections[i].nodes.length; j++) {
            if (j % rowWidth == 0) {
                rows.push([])
            }

            let data = { height: sections[i].nodes[j].height, width: sections[i].nodes[j].width }
            rows[rows.length - 1].push(data)
        }

        let rowStickyWidth = 0
        let prevMaxHeights = 0
        let gap = 60

        // Add Sticky notes to section
        for (let j = 0; j < sections[i].nodes.length; j++) {
            let sticky = sections[i].nodes[j].clone()
            let row = Math.floor(j / rowWidth)
            let col = (j % rowWidth)

            if (col == 0 && row > 0) {
                prevMaxHeights += Math.max(...rows[row - 1].map(s => s.height))
                rowStickyWidth = 0
            }

            sticky.x = ((col + 1) * gap) + rowStickyWidth
            rowStickyWidth += rows[row][col].width
            sticky.y = ((row + 1) * gap) + prevMaxHeights

            section.appendChild(sticky)

            // Add height of last row for calculating section height
            if (j == sections[i].nodes.length - 1) {
                prevMaxHeights += Math.max(...rows[row].map(s => s.height))
            }

        }

        // Resize section to fit Stickies
        let widths = []
        for (let i = 0; i < rows.length; i++) {
            widths.push(rows[i].map(row => row.width).reduce((prev, curr) => prev + curr, 0) + (gap * (rows[i].length + 1)))
        }

        let maxWidth = Math.max(...widths)
        x += maxWidth + 240

        section.resizeWithoutConstraints(maxWidth, ((rows.length + 1) * gap) + prevMaxHeights)
        realSections.push(section)

    }

    figma.currentPage.selection = realSections
    figma.viewport.scrollAndZoomIntoView(realSections)
}


figma.ui.onmessage = msg => {
    var tags
    var selected
    var sections
    var children = figma.currentPage.selection
    const nodes = getSelectedStickies(children)

    switch (msg.type) {
        case 'add-tag':
            loadFonts().then(() => {
                for (let i = 0; i < nodes.length; i++) {
                    // Add after a \n\n from last character
                    // Or add after the last existing tag
                    let curr = nodes[i].text.characters
                    let tag = `${front}${msg.tag.trim()}${back}`

                    if (curr.includes(tag)) {
                        // If tag is already on Note, don't duplicate
                        continue
                    } else if (curr.includes(front) && curr.includes(back)) {
                        // Find last tag, place '\n + tag' after that
                        let lastOpen = curr.lastIndexOf(front)
                        let nextClose = curr.indexOf(back, lastOpen) + back.length
                        nodes[i].text.characters = [curr.slice(0, nextClose), '\n', tag, curr.slice(nextClose)].join('');

                    } else if (curr.endsWith("\n\n")) {
                        nodes[i].text.characters = `${curr}${tag}`

                    } else if (curr.endsWith("\n")) {
                        nodes[i].text.characters = `${curr}\n${tag}`

                    } else {
                        nodes[i].text.characters = `${curr}\n\n${tag}`
                    }
                }
                resetTags()
            })
            break


        case 'remove-tag':
            let tag = `${front}${msg.tag.trim()}${back}`
            let longTag = `\n${tag}`

            loadFonts().then(() => {
                for (let i = 0; i < nodes.length; i++) {
                    while (nodes[i].text.characters.includes(tag)) {
                        nodes[i].text.characters = nodes[i].text.characters.replace(longTag, '')
                        nodes[i].text.characters = nodes[i].text.characters.replace(tag, '')
                    }
                }
                resetTags()
            })
            break


        case 'check-selected':
            let message = "invalid"
            if (getSelectedStickies(children).length > 0) {
                message = "valid"
            }

            figma.ui.postMessage({ msg: message })
            break


        case 'section-tag':
            tags = getActiveTags(figma.currentPage.selection)
            selected = getSelectedStickies(figma.currentPage.selection)
            sections = []

            // Fill sections with title and Sticky Nodes
            for (let i = 0; i < tags.length; i++) {
                let section = { title: tags[i], nodes: [] }
                for (let j = 0; j < selected.length; j++) {
                    if (selected[j].text.characters.includes(`${front}${tags[i]}${back}`)) {
                        section.nodes.push(selected[j])
                    }
                }
                sections.push(section)
            }

            // Add no tag section
            let noTags = { title: 'no tags', nodes: [] }
            for (let i = 0; i < selected.length; i++) {
                let temp_tags = selected[i].text.characters.split(front).filter(tag => tag.indexOf(back) > 0).map(tag => tag.split(back)[0].trim())
                if (temp_tags.length == 0) {
                    noTags.nodes.push(selected[i])
                }
            }

            if (noTags.nodes.length > 0) {
                sections.push(noTags)
            }

            makeSections(sections)
            break


        case 'section-color':
            selected = getSelectedStickies(figma.currentPage.selection)
            sections = []

            let activeColorIds = selected.map(s => s.fills[0].color)
            let activeColors = []
            let nodeColors = []

            // Match colour codes with names for system defaul colours
            for (let i = 0; i < selected.length; i++) {
                let colorName = "custom"
                for (let j = 0; j < colors.length; j++) {
                    if (activeColorIds[i].r == colors[j].r && activeColorIds[i].g == colors[j].g && activeColorIds[i].b == colors[j].b) {
                        activeColors.push(colors[j].name)
                        colorName = colors[j].name
                        break
                    }
                }

                nodeColors.push({ node: selected[i], color: colorName })

            }

            activeColors = [...new Set(activeColors)]
            if (nodeColors.map(nc => nc.color).includes("custom")) {
                activeColors.push("custom")
            }


            // Fill sections with title and Sticky Nodes
            for (let i = 0; i < activeColors.length; i++) {
                let section = { title: activeColors[i], nodes: [] }
                for (let j = 0; j < nodeColors.length; j++) {
                    if (nodeColors[j].color === activeColors[i]) {
                        section.nodes.push(nodeColors[j].node)
                    }
                }
                sections.push(section)
            }

            makeSections(sections)
            break


        case 'section-author':
            selected = getSelectedStickies(figma.currentPage.selection)
            sections = []

            let activeAuthors = selected.map(s => s.authorName)
            activeAuthors = [...new Set(activeAuthors)]

            // Fill sections with title and Sticky Nodes
            for (let i = 0; i < activeAuthors.length; i++) {
                let section = { title: activeAuthors[i], nodes: [] }
                for (let j = 0; j < selected.length; j++) {
                    if (selected[j].authorName === activeAuthors[i]) {
                        section.nodes.push(selected[j])
                    }
                }
                sections.push(section)
            }

            makeSections(sections)
            break


        case "update-symbols":
            front = msg.front
            back = msg.back
            figma.root.setPluginData('front', front)
            figma.root.setPluginData('back', back)

            resetTags()
            break


        default:
            break
    }

};