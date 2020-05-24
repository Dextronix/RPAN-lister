var streams = [];
var barn = new Barn(localStorage);
barn.condense();

$(document).ready(function () {
    $.ajaxSetup({
        cache: false
    });
});

String.prototype.TrimToLen = function (length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}

var sort = "" || barn.get('sort_sort');
var isAsc = false || barn.get('sort_isAsc');
var sortindex = -1;
var Elemindex = 0 || barn.get('sort_Elemindex');

if (sort !== "" && Elemindex > 0) {
    let elm = $("tr th");
    switch (isAsc) {
    case true:
        elm.eq(Elemindex).addClass("down");
        sortindex = 0;
        break;
    case false:
        elm.eq(Elemindex).addClass("up");
        sortindex = 1;
        break;
    }
}

$("tr th").dblclick(function () {

    if (($(this).attr("sortby") == sort) && (sortindex < 2)) {
        sortindex++;
        sort = $(this).attr("sortby");
    } else {
        sortindex = 0;
        sort = $(this).attr("sortby");
    }

    $("tr th").each(function () {
        $(this).removeClass();
    });

    switch (sortindex) {
    case 0:
        $(this).addClass("down");
        isAsc = true;
        break;
    case 1:
        $(this).addClass("up");
        isAsc = false;
        break;
    default:
        sort = "";
        break;
    }

    barn.set('sort_Elemindex', $(this).index()); // Remember the index of clicked item
    barn.set('sort_isAsc', isAsc); // isAsc is the binary value for up / down arrow
    barn.set('sort_sort', sort); // sort sort sort value for sorting the sort

    refreshData();
});

window.addEventListener('keydown', function (e) {
    if (e.keyCode === 13) alert("Coded by StoneIncarnate!"); // enter
    if (e.keyCode === 27) refreshData(); // esc	
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 88) console.log(`DEBUG VALUES:\nHighlighted users: ${barn.smembers('highlitUsers')}\nHidden users: ${(barn.smembers('hiddenUsers') || "none")}\nSort: ${barn.get('sort_sort')}\nisAsc: ${barn.get('sort_isAsc')}\nElemindex: ${barn.get('sort_Elemindex')}`);
});

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
    parseStreams();
}

function parseStreams() {
    $("table tbody").append("Loading stream data...");

    let UserHL = barn.smembers('highlitUsers') || [];

    $.getJSON("https://strapi.reddit.com/broadcasts", function (json) {
        $("#tableFLIP").empty();
        if (json.status == "success") {
            $.each(json.data, function (index, item) {
                let sugar = item.post; // JavaScript Diabetes				
                let streamlink = sugar.url;
                let title = sugar.title;
                let subreddit = sugar.subreddit.name;
                let username = sugar.authorInfo.name;
                let upvotes = item.upvotes;
                let downvotes = item.downvotes;
                let timeon = item.broadcast_time;
                let timeleft = item.estimated_remaining_time;
                let contviews = item.continuous_watchers;
                let tempviews = item.unique_watchers;

                streams.push({
                    "link": streamlink,
                    "title": title.toLowerCase(),
                    "subreddit": subreddit.toLowerCase(),
                    "username": username.toLowerCase(),
                    "upvotes": upvotes,
                    "downvotes": downvotes,
                    "timeon": timeon,
                    "timeleft": timeleft,
                    "contviews": contviews,
                    "tempviews": tempviews,
                    "highlight": UserHL.includes(username.toLowerCase())
                });

            });

            if (sort !== "") {
                listStreams(sort, isAsc);
            } else {
                listStreams();
            }

        } else {
            $("table tbody").append("An error occured, try again");
        }
    });
}

function listStreams(sort = 'none', isAsc = true) {

    /* I then sort them and display */
    var order;

    /* let highlight = _.filter(streams, ["highlight", true]);  */
    let refined = _.reject(streams, data => _.includes(barn.smembers('hiddenUsers'), data.username)); /* highlit and hidden are removed */

    /* feed sorting function "asc" and "desc" */
    order = 1 == isAsc ? "asc" : "desc";
    master_index = 0;

    if (sort !== 'none') {
        obj = _.orderBy(refined, sort, order);
        console.log("Ordering by " + sort + ", " + order);
    } else {
        obj = refined;
        console.log("Not ordering");
    }

    $("#tableFLIP").empty();

    $.each(obj, function (index, item) {

        var markup = `<tr class="result" ${item.highlight?'style="background: lightyellow"':""}><td>${index+1}</td><td data_value="streamIDhere" data_menu="stream"><a title="${item.title}"  onclick="openTab('${item.link}');">${item.title.TrimToLen(50)}</a></td><td data_value ="${item.subreddit}" data_menu="sub">r/${item.subreddit}</td><td data_value = "${item.username}" data_menu="${item.highlight?"user2":"user"}"><a onclick="openTab('https://www.reddit.com/user/${item.username}');">u/${item.username}</a></td><td>${item.contviews}</td><td>${item.upvotes}</td><td>${item.downvotes}</td><td>${formatTime(item.timeon)}</td><td>${formatTime(item.timeleft)}</td></tr>`;

        $("table tbody").append(markup);
    });

    $("tr td").bind("contextmenu", function (event) {
        event.preventDefault();
        var data = $(this).attr("data_value");

        switch ($(this).attr("data_menu")) {

            /*  case "stream":
                 $(".custom-menu").html('<li data-action="stream_ID">Copy streamID</li>');
                 break; */
            /* <li data-action="user_hide">Hide user</li> */

        case "user":
            $(".custom-menu").html('<li data-action="user_hlt">Highlight user</li>');
            break;

        case "user2":
            $(".custom-menu").html('<li data-action="user_unhlt">Unhighlight user</li>');
            break;

            /*  case "sub":
                $(".custom-menu").html('<li data-action="sub_hlt">Highlight sub</li><li data-action="sub_hide">Hide sub</li>');
                break; */

        default:
            $(".custom-menu").html('');
        }

        $(".custom-menu").finish().toggle(100).
        css({
            top: event.pageY + "px",
            left: event.pageX + "px"
        });

        $(document).bind("mousedown", function (e) {
            if (!$(e.target).parents(".custom-menu").length > 0) {
                $(".custom-menu").hide(100);
            }
        });

        $(".custom-menu li").click(function () {
            switch ($(this).attr("data-action")) {
            case "user_hlt":
                barn.sadd('highlitUsers', data);
                refreshData(); //soft refresh
                break;
            case "user_unhlt":
                barn.srem('highlitUsers', data);
                refreshData(); //soft refresh
                break;
                /*case "stream_ID":
                      alert("Copied stream ID: " + data);
                      break;
                  case "user_hide":
                      alert("Hiding user " + data);
                      break; 
                  case "sub_hlt":
                      alert("Hightling sub " + data);
                      break;
                  case "sub_hide":
                      alert("Hiding sub " + data);
                      break; */
            }
            $(".custom-menu").hide(100);
        });

    });

}

parseStreams();