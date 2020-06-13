var streams = [];
var barn = new Barn(localStorage);
checkdarkmode();
checkar();
barn.condense();

function getCookiestate(){
 return new Promise(function(resolve, reject) {
var cookie = barn.get("cookieconsent");	
	if (cookie === true || false){
		resolve(cookie);
	} else{
		setTimeout(function () {
        $("#cookieform1").fadeIn(1000);
     }, 2000);
    $("#cookieform1 .allowbtn").click(function() {
        $("#cookieform1").fadeOut(200);
		barn.set("cookieconsent",true);
		resolve(true);
    });  
	  $("#cookieform1 .closebtn").click(function() {
        $("#cookieform1").fadeOut(200);
		barn.set("cookieconsent",false);
		      resolve(false);

    });
	}	
	 });
}

function checkdarkmode(){
$("html").toggleClass("darkmode", barn.get("setting_darkmode") || false);
}

function checkar(){
var ar = barn.get('setting_refresh') || false;
var interval = barn.get('setting_interval') || 10;
if (ar){
var refreshloop = setInterval(function(){ refreshData(); }, interval*1000);
}
}

$(document).ready(function () {
    $.ajaxSetup({
        cache: false
    });
});

String.prototype.TrimToLen = function (length) {
    return this.length > length ? this.substring(0, length) + "..." : this;
}

var BSmode = false || barn.get('setting_BSmode');
var sort = "" || barn.get('sort_sort');
var isAsc = false || barn.get('sort_isAsc');
var sortindex = -1;
var Elemindex = 0 || barn.get('sort_Elemindex');

BSmode&&$('#resulttable').find('thead tr th:nth-child(7)').after('<th sortby="comments"><a>Comments</a></th>');

if (sort !== "" && Elemindex > 0) {
    let elm = $("tr th");
	if (isAsc){
	elm.eq(Elemindex).addClass("down");
        sortindex = 0;	
	}
	else{
		elm.eq(Elemindex).addClass("up");
        sortindex = 1;
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


	if (sortindex == 0){
		$(this).addClass("down");
        isAsc = true;
	}
    else if (sortindex == 1){
		 $(this).addClass("up");
        isAsc = false;
	}
	else {
		sort = "";
	}

    barn.set('sort_Elemindex', $(this).index());
    barn.set('sort_isAsc', isAsc);
    barn.set('sort_sort', sort);
    s_refreshData();
	
	});
	

window.addEventListener('keydown', function (e) {
	if (e.key === "j"){
		BSmode=!BSmode,barn.set("setting_BSmode",BSmode),BSmode?(alert("BSmode activated\nRefreshing..."),location.reload()):(alert("BSmode deactivated\nRefreshing..."),barn.set('sort_sort', ""),location.reload());
	}
    if (e.keyCode === 13) alert("Coded by StoneIncarnate!"); // enter
    if (e.keyCode === 27) refreshData(); // esc	
    if ((e.ctrlKey || e.metaKey) && e.keyCode == 88) console.log(
	`DEBUG VALUES:\n
	Highlighted users: ${barn.smembers('highlitUsers') || "none"}\n
	Hidden users: ${(barn.smembers('hiddenUsers') || "none")}\n
	Hidden subs: ${(barn.smembers('hiddenSubs') || "none")}\n
	Sort: ${barn.get('sort_sort')}\n
	isAsc: ${barn.get('sort_isAsc')}\n
	Elemindex: ${barn.get('sort_Elemindex')}\n
	BSmode: ${barn.get('setting_BSmode')}\n
	Darkmode: ${barn.get('setting_darkmode')}\n
	Auto refresh: ${barn.get('setting_refresh')}\n
	Refresh interval: ${barn.get('setting_interval')}\n
	`);
});

function getList(index) {
	if (index == 0){
		return barn.smembers('highlitUsers') || [];
	}
	else if (index == 1){
		return barn.smembers('hiddenUsers') || [];
	}
	else if (index == 2){
		return barn.smembers('hiddenSubs') || [];
	}
	else if (index == 3){
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
    parseStreams();
}

function s_refreshData() {
    listStreams(sort, isAsc);
}

function parseStreams() {
    $("#tableFLIP").empty();
    $("table tbody").append("Loading stream data...");

    let UserHL = barn.smembers('highlitUsers') || [];

    $.getJSON('https://strapi.reddit.com/broadcasts').done(function (json) {
        $("#tableFLIP").empty();
        $.each(json.data, function (index, item) {	
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
    }).fail(function (jqxhr) {
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
    master_index = 0;

    if (sort !== 'none') {
        obj = _.orderBy(hidesubs, sort, order);
        console.log("Ordering by " + sort + ", " + order);
    } else {
        obj = hidesubs;
        console.log("Not ordering");
    }

    $("#tableFLIP").empty();

    $.each(obj, function (index, item) {		
        var bsmodestr = BSmode?`<td>${item.comments}</td>`:'';

		var markup = `<tr class="result${item.highlight?' marked"':""}"><td>${index+1}</td><td data_menu="stream"><a title="${item.title}"  onclick="openTab('${item.link}');">${item.title.TrimToLen(50)}</a></td><td data_value ="${item.subreddit}" data_menu="sub">r/${item.subreddit}</td><td data_value = "${item.username}" data_menu="${item.highlight?"user2":"user"}"><a onclick="openTab('https://www.reddit.com/user/${item.username}');">u/${item.username}</a></td><td>${item.contviews}</td><td>${item.upvotes}</td><td>${item.downvotes}</td>${bsmodestr}<td>${formatTime(item.timeon)}</td><td>${formatTime(item.timeleft)}</td></tr>`;

        $("table tbody").append(markup);
    });

    $("tr td").bind("contextmenu", function (event) {
        event.preventDefault();
        var data = $(this).attr("data_value");
		var menu = $(this).attr("data_menu");
		
		if (menu == "user"){
			$(".custom-menu").html('<li data-action="user_hlt">Highlight user</li><li data-action="user_hide">Hide user</li>');
		}
		else if (menu == "user2"){
			$(".custom-menu").html('<li data-action="user_unhlt">Unhighlight user</li><li data-action="user_hide">Hide user</li>');
		}
		else if (menu == "sub"){
			$(".custom-menu").html('<li data-action="sub_hide">Hide Subreddit</li>');
		}
		else {
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
		var action = $(this).attr("data-action");	
			if (action == "user_hlt"){
				barn.sadd('highlitUsers', data);
                refreshData(); 
			}
			else if (action == "user_unhlt"){
				barn.srem('highlitUsers', data);
                refreshData();
			}
			else if (action == "user_hide"){
				barn.sadd('hiddenUsers', data);
                refreshData();
			}
			else if (action == "sub_hide"){
				barn.sadd('hiddenSubs', data);
                refreshData();
			}
			
            $(".custom-menu").hide(100);
        });
    });
}

parseStreams();