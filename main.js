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
    searchStreams();
}

function searchStreams() {
    fetch('https://strapi.reddit.com/broadcasts')
        .then(data => data.json())
        .then(json => {

            $("#tableFLIP").empty();

            if (json.status == "success") {

                $.each(json.data, function(index, item) {
                    let sugar = item.post; // JavaScript Diabetes
                    let streamlink = sugar.url;
                    let streamname = sugar.title;
                    let subreddit = sugar.subreddit.prefixedName;
                    let username = sugar.authorInfo.name;
                    let upvotes = item.upvotes;
                    let downvotes = item.downvotes;
                    let timeup = item.broadcast_time;
                    let timeleft = item.estimated_remaining_time;
                    //style="display: none;"
                    var markup = `<tr class="result" ><td><a target="_blank" title="open stream" onclick="openTab('${streamlink}')">${streamname}</a></td><td>${subreddit}</td><td><a target="_blank" title="open userpage" onclick="openTab('https://reddit.com/u/${username}')">u/${username}</a></td><td>${upvotes}/${downvotes}</td><td>${formatTime(timeup)}</td><td>${formatTime(timeleft)}</td></tr>`;

                    $("table tbody").append(markup);

                });

            } else {
                $("table tbody").append("An error occured, try again");
            }

        })

}

searchStreams()