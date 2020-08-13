var streams = [];
var barn = new Barn(localStorage);
checkdarkmode();
checkar();

function getCookiestate() {
    return new Promise(function(resolve, reject) {
        var cookie = barn.get("cookieconsent");
        if ((cookie !== null)) {
            resolve(cookie);
        } else {
            setTimeout(function() {
                $("#cookieform1").fadeIn(1000);
            }, 2000);
            $("#cookieform1 .allowbtn").click(function() {
                $("#cookieform1").fadeOut(200);
                barn.set("cookieconsent", true);
                resolve(true);
            });
            $("#cookieform1 .closebtn").click(function() {
                $("#cookieform1").fadeOut(200);
                barn.set("cookieconsent", false);
                resolve(false);
            });
        }
    });
}

function checkdarkmode() {
    var colors;
    const colorNames = ["main-color", "border", "highlight", "color-a", "color-b", "accent", "accent-hover"];
    var customcolors = JSON.parse(barn.get("setting_colors")) || {
        customdark: false,
        customlight: false,
        dark: [],
        light: []
    };
    var darktheme = barn.get("setting_darkmode") || false;
    $("html").toggleClass("darkmode", darktheme);

    /* this checks if custom colors are set */
    if (darktheme) {
        if (customcolors.customdark == true) {
            colors = [...customcolors.dark];
        }
    } else {
        if (customcolors.customlight == true) {
            colors = [...customcolors.light];
        }
    }
    /* this applies custom color variables if defined */
    if (colors) {
        $.each(colors, function(index, value) {
            document.documentElement.style.setProperty('--' + colorNames[index], value);
        });
    }
}

function checkar() {
    var ar = barn.get('setting_refresh') || false;
    var interval = barn.get('setting_interval') || 10;
    if (ar) {
        var refreshloop = setInterval(function() {
            refreshData();
        }, interval * 1000);
    }
}

$(document).ready(function() {
    $.ajaxSetup({
        cache: false
    });
});

String.prototype.TrimToLen = function(length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}

var oldReddit = false || barn.get('setting_oldReddit');
var BSmode = false || barn.get('setting_BSmode');
var sort = "" || barn.get('sort_sort');
var isAsc = false || barn.get('sort_isAsc');
var sortindex = -1;
var Elemindex = 0 || barn.get('sort_Elemindex');

BSmode && $('#resulttable').find('thead tr th:nth-child(7)').after('<th sortby="comments"><a>Comments</a></th>');

if (sort !== "" && Elemindex > 0) {
    let elm = $("tr th");
    if (isAsc) {
        elm.eq(Elemindex).addClass("down");
        sortindex = 0;
    } else {
        elm.eq(Elemindex).addClass("up");
        sortindex = 1;
    }
}

$("tr th").dblclick(function() {

    if (($(this).attr("sortby") == sort) && (sortindex < 2)) {
        sortindex++;
        sort = $(this).attr("sortby");
    } else {
        sortindex = 0;
        sort = $(this).attr("sortby");
    }

    $("tr th").each(function() {
        $(this).removeClass();
    });


    if (sortindex == 0) {
        $(this).addClass("down");
        isAsc = true;
    } else if (sortindex == 1) {
        $(this).addClass("up");
        isAsc = false;
    } else {
        sort = "";
    }

    barn.set('sort_Elemindex', $(this).index());
    barn.set('sort_isAsc', isAsc);
    barn.set('sort_sort', sort);
    s_refreshData();

});


window.addEventListener('keydown', function(e) {
    if (e.key === "j") {
        BSmode = !BSmode, barn.set("setting_BSmode", BSmode), BSmode ? (alert("BSmode activated\nRefreshing..."), location.reload()) : (alert("BSmode deactivated\nRefreshing..."), barn.set('sort_sort', ""), location.reload());
    }
    if (e.keyCode === 13) alert("Coded by StoneIncarnate!"); // enter
    if (e.keyCode === 27) refreshData(); // esc	
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 88) console.log(
        `DEBUG VALUES:\nHighlighted users: ${barn.smembers('highlitUsers') || "none"}\nHidden users: ${(barn.smembers('hiddenUsers') || "none")}\nHidden subs: ${(barn.smembers('hiddenSubs') || "none")}\nSort: ${barn.get('sort_sort')}\nisAsc: ${barn.get('sort_isAsc')}\nElemindex: ${barn.get('sort_Elemindex')}\nBSmode: ${barn.get('setting_BSmode')}\nDarkmode: ${barn.get('setting_darkmode')}\nAuto refresh: ${barn.get('setting_refresh')}\nRefresh interval: ${barn.get('setting_interval')}\n`);
});

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

function openTab(src) {
    window.open(src, "_blank");
}

function formatTime(time) {
    var hrs = ~~(time / 3600);
    var mins = ~~((time % 3600) / 60);
    var secs = ~~time % 60; // hehe secs
    var ret = "";
    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }
    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}

function refreshData() {
    streams = [];
    location.reload();
}

function s_refreshData() {
    listStreams(sort, isAsc);
}

function parseStreams() {
    $("#tableFLIP").empty();
    $("table tbody").append("Loading stream data...");

    let UserHL = barn.smembers('highlitUsers') || [];

    $.getJSON('https://strapi.reddit.com/broadcasts').done(function(json) {
        $("#tableFLIP").empty();
        $.each(json.data, function(index, item) {
            let sugar = item.post; // JavaScript Diabetes	
            let comments = sugar.commentCount || "0";
            let streamlink = sugar.url || "error";
            let title = sugar.title || "error";
            let subreddit = sugar.subreddit.name || "error";
            let username = sugar.authorInfo.name || "error";
            let upvotes = item.upvotes || "0";
            let downvotes = item.downvotes || "0";
            let timeon = item.broadcast_time || "0";
            let timeleft = item.estimated_remaining_time || "0";
            let contviews = item.continuous_watchers || "0";
            let tempviews = item.unique_watchers || "0";
            let state = item.stream.state || "ENDED";

            streams.push({
                "comments": comments,
                "state": state,
                "link": streamlink,
                "title": title.toLowerCase(),
                "subreddit": subreddit.toLowerCase(),
                "username": username.toLowerCase(),
                "upvotes": upvotes,
                "downvotes": downvotes,
                "timeon": timeon,
                "timeleft": timeleft,
                "contviews": contviews,
                /* "tempviews": tempviews, */
                "highlight": UserHL.includes(username.toLowerCase())
            });

        });

        if (sort !== "") {
            listStreams(sort, isAsc);
        } else {
            listStreams();
        }
    }).fail(function(jqxhr) {
        if (jqxhr.status == 200) {
            alert("The RPAN server appears to have been blocked by something!\nYou may need to whitelist the RPAN stream API for this site!");
        } else if (jqxhr.status == 500) {
            $("#tableFLIP").empty();
            $("table tbody").append(`  Error ${jqxhr.status} Refreshing...`);
            _.delay(function() {
                refreshData()
            }, 500, 'later');
        } else {
            $("#tableFLIP").empty();
            $("table tbody").append(`Error ${jqxhr.status}`);
        }
    });
}

function listStreams(sort = 'none', isAsc = true) {
    var order;
    let onlylive = _.filter(streams, data => _.includes("IS_LIVE", data.state)); /* only live streams */
    let hideusers = _.reject(onlylive, data => _.includes(barn.smembers('hiddenUsers'), data.username)); /* hidden users are removed */
    let hidesubs = _.reject(hideusers, data => _.includes(barn.smembers('hiddenSubs'), data.subreddit)); /* hidden subs are removed */

    order = 1 == isAsc ? "asc" : "desc";

    if (sort !== 'none') {
        obj = _.orderBy(hidesubs, sort, order);
        console.log("Ordering by " + sort + ", " + order);
    } else {
        obj = hidesubs;
        console.log("Not ordering");
    }

    $("#tableFLIP").empty();

    $.each(obj, function(index, item) {
        var bsmodestr = BSmode ? `<td><a class="txt">${item.comments}</a></td>` : '';
        var redditv = oldReddit ? "https://old." : "https://www.";
        var markup = `<tr data_title="${item.title}" data_link="${item.link}" class="result${item.highlight?' marked"':""}"><td>${index+1}</td><td data_value ="${index}" data_menu="stream"><a class="lnk" title="${item.title}" onclick="openTab('${item.link}');">${item.title.TrimToLen(50)}</a></td><td data_value ="${item.subreddit}" data_menu="sub"><a class="lnk" onclick="openTab('${redditv}reddit.com/r/${item.subreddit}');">r/${item.subreddit}</a></td><td data_value = "${item.username}" data_menu="${item.highlight?"user2":"user"}"><a class="lnk" onclick="openTab('${redditv}reddit.com/user/${item.username}');">u/${item.username}</a></td><td><a class="txt">${item.contviews}</a></td><td><a class="txt">${item.upvotes}</a></td><td><a class="txt">${item.downvotes}</a></td> ${bsmodestr}<td><a class="txt">${formatTime(item.timeon)}</a></td><td><a class="txt">${formatTime(item.timeleft)}</a></td></tr>`;

        $("table tbody").append(markup);
    });

    $("tr td").bind("contextmenu", function(event) {
        event.preventDefault();
        var data = $(this).attr("data_value");
        var menu = $(this).attr("data_menu");

        if (menu == "user") {
            $(".custom-menu").html('<li data-action="user_copy">Copy user</li><li data-action="user_hlt">Highlight user</li><li data-action="user_hide">Hide user</li>');
        } else if (menu == "user2") {
            $(".custom-menu").html('<li data-action="user_copy">Copy user</li><li data-action="user_unhlt">Unhighlight user</li><li data-action="user_hide">Hide user</li>');
        } else if (menu == "stream") {
            $(".custom-menu").html('<li data-action="stream_copytitle">Copy Title</li><li data-action="stream_copylink">Copy Link</li>');
        } else if (menu == "sub") {
            $(".custom-menu").html('<li data-action="sub_hide">Hide Subreddit</li>');
        } else {
            $(".custom-menu").html('');
        }

        $(".custom-menu").finish().toggle(100).
        css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });

        $(document).bind("mousedown", function(e) {
            if (!$(e.target).parents(".custom-menu").length > 0) {
                $(".custom-menu").hide(100);
            }
        });

        $(".custom-menu li").click(function() {
            var action = $(this).attr("data-action");
            if (action == "user_hlt") {
                barn.sadd('highlitUsers', data);
                refreshData();
            } else if (action == "user_unhlt") {
                barn.srem('highlitUsers', data);
                refreshData();
            } else if (action == "user_hide") {
                barn.sadd('hiddenUsers', data);
                refreshData();
            } else if (action == "user_copy") {
                copyClip(data);
            } else if (action == "sub_hide") {
                barn.sadd('hiddenSubs', data);
                refreshData();
            } else if (action == "stream_copytitle") {
                var target = $('#tableFLIP').find("tr").eq(data);
                var title_ = target.attr("data_title");
                copyClip(title_);
            } else if (action == "stream_copylink") {
                var target = $('#tableFLIP').find("tr").eq(data);
                var link_ = target.attr("data_link");
                copyClip(link_);
            }
            $(".custom-menu").hide(100);
        });
    });
}

/* util function for copying to clipboard */
function copyClip(text) {
    var ta = $("<textarea>", {
        "style": "top:0,left:0,position:fixed;",
        "val": text,
        "class": "copytext"
    });
    $("body").append(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
}

parseStreams();