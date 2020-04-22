var streams = [];

String.prototype.TrimToLen = function(length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}

$(document).keyup(function(e) {
    if (e.keyCode === 13) alert("Coded by StoneIncarnate!"); // enter
    if (e.keyCode === 27) refreshData(); // esc
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
    /* Instead of processing the entire object, I first pull out the most important parts */
    fetch('https://strapi.reddit.com/broadcasts')
        .then(data => data.json())
        .then(json => {
            $("#tableFLIP").empty();
            if (json.status == "success") {
                $.each(json.data, function(index, item) {
                    let sugar = item.post; // JavaScript Diabetes				
                    let streamlink = sugar.url;
                    let title = sugar.title;
                    let subreddit = sugar.subreddit.name;
                    let username = sugar.authorInfo.name;
                    let upvotes = item.upvotes;
                    let downvotes = item.downvotes;
                    let timeon = item.broadcast_time;
                    let timeleft = item.estimated_remaining_time;

                    streams.push({
                        "link": streamlink,
                        "title": title,
                        "subreddit": subreddit,
                        "username": username,
                        "upvotes": upvotes,
                        "downvotes": downvotes,
                        "timeon": timeon,
                        "timeleft": timeleft
                    });

                });
                //listStreams("timeon", true);
                listStreams();
            } else {
                $("table tbody").append("An error occured, try again");
               // ERROR
            }
        })
}

function listStreams(sort = 'none', isAsc = true) {
    /* I then sort them and display */
    var order;

    /* feed sorting function "asc" and "desc" */
    order = 1 == isAsc ? "asc" : "desc";

    if (sort !== 'none') {
        obj = _.orderBy(streams, sort, order);
        console.log("Ordering by " + sort + ", " + order);
    } else {
        obj = streams;
        console.log("Not ordering");
    }

    $("#tableFLIP").empty();

    $.each(obj, function(index, item) {
        var markup = `<tr class="result" ><td><a target="_blank" title="open stream" onclick="openTab('${item.link}')">${item.title.TrimToLen(50)}</a></td><td>r/${item.subreddit}</td><td><a target="_blank" title="open userpage" onclick="openTab('https://reddit.com/u/${item.username}')">u/${item.username}</a></td><td>${item.upvotes}</td><td>${item.downvotes}</td><td>${formatTime(item.timeon)}</td><td>${formatTime(item.timeleft)}</td></tr>`;

        $("table tbody").append(markup);
    });

}

parseStreams()
