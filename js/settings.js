var barn = new Barn(localStorage);

/* stuff for managing lists */
var trashStack = [];
var activeStack = {
    "selectedtmp": [],
    "activeList": 0,
    "list": "0"
};

/* color defaults & cssvar names*/
const lightMode = ["#FFF", "#CCC", "lightyellow", "#000", "#000", "#DDD", "#CCC"];
const darkMode = ["#181a1b", "#575757", "#545a5e", "#FFF", "#FFF", "#27292b", "#222425"];
const colorNames = ["main-color_", "border_", "highlight_", "color-a_", "color-b_", "accent_", "accent-hover_"];
var customcolors = JSON.parse(barn.get("setting_colors")) || {
    customdark: false,
    customlight: false,
    dark: [],
    light: []
};
var darktheme = barn.get("setting_darkmode") || false;
var colortmp = getcolortmp();
checkdarkmode();

function getcolortmp() {
    if (darktheme) {
        if (customcolors.customdark == true) {
            return [...customcolors.dark];
        } else {
            return [...darkMode];
        }
    } else {
        if (customcolors.customlight == true) {
            return [...customcolors.light];
        } else {
            return [...lightMode];
        }
    }
}

var colorStack = {
    "index": 0
};

var pickr = Pickr.create({
    el: '.pickr-container1',
    theme: 'nano',
    autoReposition: false,
    inline: false,
    useAsButton: true,
    position: 'top-middle',
    swatches: [],
    defaultRepresentation: 'HEXA',
    components: {
        preview: true,
        opacity: false,
        hue: true,
        interaction: {
            hex: false,
            rgba: false,
            hsva: false,
            input: true,
            clear: false,
            save: true
        }
    }
});

function checkdarkmode() {
    darktheme = barn.get("setting_darkmode") || false;
    $("html").toggleClass("darkmode", darktheme);
    /* below code sets the theme pallet for the color customizer*/
    colortmp = getcolortmp();
}

function goBack() {
    window.location.href = "/RPAN-lister";
}

/* trash controls*/
$(".trashcontrols a").on("click", function() {
    var index = $(this).index();
    if (trashStack.length > 0) {
        if (index == 0) {
            doRestore();
        } else if (index == 1) {
            deletetrash();
        }
    }
});

$(document).ready(function() {

    $("#colormode").val(darktheme ? "dark" : "light").trigger("change");

    $("#colormode").on("change", function() {
        var opt = $(this).val();
        if (opt == "light") {
            barn.set("setting_darkmode", false);
            colortmp = getcolortmp();
        } else if (opt == "dark") {
            barn.set("setting_darkmode", true);
            colortmp = getcolortmp();
        }

        checkdarkmode();
        loadColors(colortmp);
    });

    $(".colorpreview").on("click", function() {
        var index = $(this).attr("data-index");
        var curcolor = $(this).css("background-color");
        colorStack.index = index;
        pickr.setColor(curcolor);
        pickr.setColorRepresentation("HEX");
        pickr.show();
    });

    $(".colorbtn").on("click", function() {
        var index = $(this).index();
        if (index == 1) {
            // reset to defaults
            saveColors([], false, darktheme);
            colortmp = getcolortmp();
            loadColors(colortmp);
        } else if (index == 2) {
            // toggle highlight
            var state = $(this).attr("state");
            if (state == "off") {
                $(this).attr("state", "on");
                $(this).val("Highlight: On");
                $("tbody tr").addClass("highlight");
            } else {
                $(this).attr("state", "off");
                $(this).val("Highlight: Off");
                $("tbody tr").removeClass("highlight");
            }
        }
    });

    registerPickr();
    $(".addbutton").on("click", function() {
        var name = $(".namebox").val();
        if (name.match(/^[0-9a-zA-Z-_]{3,21}$/)) {
            barn.sadd(getlistStr(activeStack.activeList), name.toLowerCase())
            populateList(getList(activeStack.activeList));
        } else if (name.length > 21) {
            alert("Reddit user/sub names have a 21 character limit");
        } else {
            $(".namebox").val("");
            alert("Invalid user/sub name");
        }
    });

    registerSettings();
    registerSlider();
    populateList(getList(0));
});

$(document).bind("mousedown", function(e) {
    if (!$(e.target).parents(".custom-menu2").length > 0) {
        $(".custom-menu2").hide(100);
    }
});

/* Sets the active tab and active list which informs nearly every function 
which list is currently being manipulated */
$(".tabhead").on("click", function() {
    $(".custom-menu2").hide();
    activeStack.selectedtmp = [];
    var action = $(this).index();
    $(".tabhead").removeClass("active");
    $(this).addClass("active");

    if (action == 0) {
        activeStack.activeList = 0;
        populateList(getList(0));
    } else if (action == 1) {
        activeStack.activeList = 1;
        populateList(getList(1));
    } else if (action == 2) {
        activeStack.activeList = 2;
        populateList(getList(2));
    } else if (action == 3) {
        activeStack.state = "trash";
        activeStack.activeList = 3;
        populateTrash();
    }
});


/* returns barn list of index*/
function getList(index) {
    if (index == 0) {
        return barn.smembers('highlitUsers') || [];
    } else if (index == 1) {
        return barn.smembers('hiddenUsers') || [];
    } else if (index == 2) {
        return barn.smembers('hiddenSubs') || [];
    } else if (index == 3) {
        return JSON.parse(barn.get("setting_trash"));
    }
}

/* This function diff checks two given arrays, finds the difference
between the two and then adds or removes that difference to the barn list */

function manageBarn(name, after) {
    var before = barn.smembers(name);
    before = _.compact(before)
    after = _.compact(after);

    if (before.length > after.length) {
        var newList = _.difference(before, after);
        $.each(newList, function(index, value) {
            barn.srem(name, value);
        });
    } else if (before.length < after.length) {
        var newList = _.difference(after, before);
        $.each(newList, function(index, value) {
            barn.sadd(name, value);
        });
    }
    barn.condense();
}

/* Sets a barn list using the above function*/
function setList(index, value) {
    if (index == 0) {
        manageBarn("highlitUsers", value);
    } else if (index == 1) {
        manageBarn("hiddenUsers", value);
    } else if (index == 2) {
        manageBarn("hiddenSubs", value);
    } else if (index == 3) {
        barn.set("setting_trash", JSON.stringify(value));
    }
}

/* returns the barn variable name of a list index*/
function getlistStr(index) {
    if (index == 0) {
        return "highlitUsers";
    } else if (index == 1) {
        return "hiddenUsers";
    } else if (index == 2) {
        return "hiddenSubs";
    }
}

/* if highlit return hidden, vice versa*/
function getMove() {
    if (activeStack.activeList == 0) {
        return 1;
    } else if (activeStack.activeList == 1) {
        return 0;
    } else {
        return -1;
    }
}

$('.controls a').on("click", function() {
    var action = $(this).index();
    if (action == 0) {
        if (!_.isEmpty(activeStack.selectedtmp)) {
            var move = getMove();
            if (move == 1) {
                moveMenu("Hidden Users");
            } else if (move == 0) {
                moveMenu("Highlit Users");
            } else {
                moveMenu();
            }
        }
    } else if (action == 1) {
        if (!_.isEmpty(activeStack.selectedtmp)) {
            deleteMenu();
        }
    } else if (action == 2) {
        $(".boxcontainer").toggle();
        $(".namebox").val("");
    }


});

/* Removes items from trash variable and adds them back to their original list*/
function doRestore() {
    $.each(trashStack, function(key, value) {
        barn.sadd(getlistStr(value.list), value.name);
    });
    deletetrash();
}

/* Copies selected items from one list to another */
function doMove(newList) {
    var mergedList = _.concat(getList(newList), activeStack.selectedtmp);
    setList(newList, mergedList);
}

/* Displays items in a defined list index*/
function populateList(list) {
    $(".boxcontainer").hide();
    $(".namebox").val("");

    $(".controls").show();
    $(".trashcontrols").hide();

    $(".listcontent").empty();

    $.each(list, function(index, value) {
        var checkbox = '<input type="checkbox" class="chkbox" value="' + value + '" name="' + value + '"><label for="' + value + '">' + value + '</label><br>';
        $(".listcontent").append($(checkbox));
    })

    $('.chkbox').on("click", function() {
        activeStack.selectedtmp = [];
        $("input[class='chkbox']:checked").each(function() {
            activeStack.selectedtmp.push($(this).attr("name"));
        });

    });
};

/* this function removes selected items for the activeList and adds them to the trashStack if needed*/
function doDelete(toTrash = true) {
    var newList = _.difference(getList(activeStack.activeList), activeStack.selectedtmp);
    setList(activeStack.activeList, newList);
    if (toTrash) {
        itemizeTrash();
    }
}

/* Add each item in selection to trashstack preserving which list they came from */
function itemizeTrash() {
    var i, TR = [];
    for (i = 0; i < activeStack.selectedtmp.length; i++) {
        TR.push({
            "name": activeStack.selectedtmp[i],
            "list": activeStack.activeList
        }); // fix this
    }

    trash = getList(3);
    trash = _.uniq(_.concat(TR, trash), _.isEqual);
    setList(3, trash);
}

/* Read the trash variable and display*/
function populateTrash() {
    $(".controls").hide();
    $(".trashcontrols").show();
    $(".listcontent").empty();
    TR = _.compact(getList(3));;

    $.each(TR, function(key, value) {
        var code = `<input type="checkbox" class="chkbox" data-list="${value.list}" data-name="${value.name}"><label for="${value.name}">${value.name}</label><br>`;
        $(".listcontent").append($(code));
    });

    $('.chkbox').on("click", function() {
        trashStack = [];
        $("input[class='chkbox']:checked").each(function() {
            trashStack.push({
                "name": $(this).attr("data-name"),
                "list": _.toSafeInteger($(this).attr("data-list"))
            });
        });
    });

};

/* Removes selected items from trash variable*/
function deletetrash() {
    var newList = _.differenceWith(getList(3), trashStack, _.isEqual);
    setList(activeStack.activeList, newList);
    populateTrash();
}

function moveMenu(string) {
    if (string) {
        $(".custom-menu2").html('<li data-action="move">' + string + '</li><li data-action="trash">Trash</li>');
    } else {
        $(".custom-menu2").html('<li data-action="trash">Trash</li>');
    }
    var p = $(".controls a").first();
    var position = p.position();
    $(".custom-menu2").finish().toggle(100).
    css({
        top: position.top + 5 + "px",
        left: (position.left - 10) + "px"
    });
    registerMenu();
}

function deleteMenu() {
    $(".custom-menu2").html('<li data-action="supertrash">Forever</li><li data-action="trash">To Trash</li>');
    var p = $(".controls a").first();
    var position = p.position();
    $(".custom-menu2").finish().toggle(100).
    css({
        top: position.top + 5 + "px",
        left: (position.left + 50) + "px"
    });
    registerMenu();
}

/* This function is called because after menu html is destroyed the events are removed
here we reset that click event*/
function registerMenu() {
    $(".custom-menu2 li").on("click", function() {
        var action = $(this).attr("data-action");
        if (action == "move") {
            doMove(getMove());
            doDelete(false);
            populateList(getList(activeStack.activeList));
        } else if (action == "trash") {
            doDelete(true);
            populateList(getList(activeStack.activeList));
        } else if (action == "supertrash") {
            doDelete(false);
            populateList(getList(activeStack.activeList));
        }
        $(".custom-menu2").hide(100);
    });
}

function registerSettings() {
    autorefresh = barn.get("setting_refresh") || false;
    $('[data-action=autorefresh]').prop("checked", autorefresh);

    $("input[class='setting']").on("change", function() {
        var action = $(this).attr("data-action");
        if (action == "autorefresh") {
            autorefresh = !autorefresh;
            barn.set("setting_refresh", autorefresh);
            registerSlider();
            if (!autorefresh) {
                barn.set("setting_interval", 10);
            }
        }

        $(".container").toggle(autorefresh);
    });

    $(".container").toggle(autorefresh);
    barn.condense();
}

/* this function handles the managing of misc settings and the interval slider */
function registerSlider() {
    var interval = barn.get("setting_interval") || 10;

    $('.range-slider').empty();
    $('.range-slider').append(`<input class="range-slider__range" type="range" value="${interval}" min="5" max="60"><span class="range-slider__value">0</span>`);

    var slider = $('.range-slider'),
        range = $('.range-slider__range'),
        value = $('.range-slider__value');

    slider.each(function() {
        value.each(function() {
            var value = $(this).prev().attr('value');
            $(this).html(interval + " s");
        });

        range.on('input', function() {
            $(this).next(value).html(this.value + " s");
        });

        range.on('mouseup touchend', function() {
            barn.set("setting_interval", this.value)
        });
    });
}

function registerPickr() {
    pickr.on('save', (color, instance) => {
        var target = $(`.colorpreview[data-index='${colorStack.index}']`);
        var color = pickr.getColor().toHEXA();
        target.css("backgroundColor", color);
        pickr.hide();
        colortmp[colorStack.index] = '#' + color.join('');
        console.log(color);
        loadColors(colortmp);
        saveColors(colortmp, true, darktheme);
    });
    loadColors(colortmp);
}

function saveColors(colors, enable, mode) {
    if (mode == true) {
        customcolors.dark = [...colors];
        if (!enable) {
            customcolors.dark = [];
        }
    } else {
        customcolors.light = [...colors];
        if (!enable) {
            customcolors.light = [];
        }
    }
    if (darktheme) {
        customcolors.customdark = enable;
    } else {
        customcolors.customlight = enable;
    }


    barn.set("setting_colors", JSON.stringify(customcolors))
}

function loadColors(colors) {
    $.each(colors, function(index, value) {
        var target = $(`.colorpreview[data-index='${index}']`);
        target.css("backgroundColor", value);
        document.documentElement.style.setProperty('--' + colorNames[index], value);
    });
}