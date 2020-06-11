var barn = new Barn(localStorage);
	checkdarkmode();
var trashStack = [];
var activeStack = {"selectedtmp":[],"activeList":0,"list":"0"}

function checkdarkmode(){
$("html").toggleClass("darkmode", barn.get("setting_darkmode") || false);
}

function goBack() {
window.location.href = "/RPAN-lister";
}


/* trash controls*/
$(".trashcontrols a").on("click", function() {
	   var index = $(this).index();
       if (trashStack.length > 0){
		   if (index == 0){
			   doRestore();
		   }
		   else if (index == 1){
			   deletetrash();
		   }
	   }
    });

$(document).ready(function() {
	$(".addbutton").on("click", function() {
		var name = $(".namebox").val();
       if (name.match(/^[0-9a-zA-Z-_]{3,21}$/)){
		   barn.sadd(getlistStr(activeStack.activeList), name.toLowerCase())
		   populateList(getList(activeStack.activeList));
	   }
	   else if (name.length > 21){
		alert("Reddit user/sub names have a 21 character limit");   
	   }
	   else{
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
	
	if (action == 0){
		activeStack.activeList = 0;
        populateList(getList(0));
	}
	else if(action == 1){
activeStack.activeList = 1;
            populateList(getList(1));
	}
	else if(action == 2){
	activeStack.activeList = 2;
            populateList(getList(2));	
	}
	else if(action == 3){
		activeStack.state = "trash";
			activeStack.activeList = 3;
			populateTrash();
	}
});

/* 
function manageBackup(){
 fetchkey = function (name){
return barn.get(name) || "";
}
 fetchlist = function (name){
return _.compact(barn.smembers(name)) || [];
}	
	
var masterArray = {};

masterArray = {"sort_sort":fetchkey("sort_sort"),"sort_isAsc":fetchkey("sort_isAsc"),"sort_Elemindex":fetchkey("sort_Elemindex"),"setting_darkmode":fetchkey("setting_darkmode"),"setting_BSmode":fetchkey("setting_BSmode"),"setting_interval":fetchkey("setting_interval"),"setting_refresh":fetchkey("setting_refresh"),"setting_trash":fetchkey("setting_trash"),"highlitUsers": fetchlist("highlitUsers"),"hiddenUsers": fetchlist("hiddenUsers"),"hiddenSubs": fetchlist("hiddenSubs")};

alert(JSON.stringify(masterArray));
var compressed = LZString.compressToEncodedURIComponent(JSON.stringify(masterArray));
alert(compressed);
}

manageBackup() */

/* returns barn list of index*/
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

/* This function diff checks two given arrays, finds the difference
between the two and then adds or removes that difference to the barn list */

function manageBarn(name, after){
var before = barn.smembers(name);
before = _.compact(before)
after = _.compact(after);

if (before.length > after.length){
var newList = _.difference(before,after);
$.each(newList, function( index, value ) {
  barn.srem(name,value);
});
}
else if (before.length < after.length) {
	var newList = _.difference(after,before);
	$.each(newList, function( index, value ) {
  barn.sadd(name,value);
}); 
}
barn.condense(); 
}

/* Sets a barn list using the above function*/
function setList(index, value) {
	if (index == 0){
		manageBarn("highlitUsers",value);
	}
	else if (index == 1){
	manageBarn("hiddenUsers",value);	
	}
	else if (index == 2){
	manageBarn("hiddenSubs",value);	
	}
	else if (index == 3){
	barn.set("setting_trash",JSON.stringify(value));	
	}
}

/* returns the barn variable name of a list index*/
function getlistStr(index) {
	if (index == 0){
	return "highlitUsers";
	}
	else if (index == 1){
	return "hiddenUsers";	
	}
	else if (index == 2){
	return "hiddenSubs";	
	}
}

/* if highlit return hidden, vice versa*/
function getMove() {
   if (activeStack.activeList == 0) {
	   return 1;
   }
   else if (activeStack.activeList == 1){
	   return 0;
   }
   else
   {
	  return -1; 
   }
}

$('.controls a').on("click", function() {
    var action = $(this).index();
	if (action == 0){
		if (!_.isEmpty(activeStack.selectedtmp)) {
				var move = getMove();
                if (move == 1) {
                    moveMenu("Hidden Users");
                } else if (move == 0) {
                    moveMenu("Highlit Users");
                }
				else {
					moveMenu();
				}					
            }
	}
	else if(action == 1){
	if (!_.isEmpty(activeStack.selectedtmp)) {
                deleteMenu();
            }	
	}
	else if(action == 2){
	 $(".boxcontainer").toggle();
	 $(".namebox").val("");	
	}
	
	
});

/* Removes items from trash variable and adds them back to their original list*/
function doRestore(){
 $.each( trashStack, function(key, value) {
	barn.sadd(getlistStr(value.list),value.name);
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
	if (toTrash){
		itemizeTrash();
	} 
}

/* Add each item in selection to trashstack preserving which list they came from */
function itemizeTrash(){
var i,TR = [];
for (i = 0; i < activeStack.selectedtmp.length; i++) {
  TR.push({"name":activeStack.selectedtmp[i],"list":activeStack.activeList}); // fix this
} 

trash = getList(3);
trash = _.uniq(_.concat(TR,trash), _.isEqual);
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
            trashStack.push({"name":$(this).attr("data-name"),"list":_.toSafeInteger($(this).attr("data-list"))});
        });
    }); 
			
};

/* Removes selected items from trash variable*/
function deletetrash(){
var newList = _.differenceWith(getList(3) ,trashStack, _.isEqual);	
setList(activeStack.activeList, newList);
populateTrash();
}

function moveMenu(string) {
	if (string){
    $(".custom-menu2").html('<li data-action="move">' + string + '</li><li data-action="trash">Trash</li>');
	}
	else
	{
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
		if (action == "move"){
			doMove(getMove());
				doDelete(false);
				populateList(getList(activeStack.activeList));
		}
		else if (action == "trash"){
		doDelete(true);
				populateList(getList(activeStack.activeList));	
		}
		else if (action == "supertrash"){
		doDelete(false);
			    populateList(getList(activeStack.activeList));	
		}	
        $(".custom-menu2").hide(100);
    });
}

 function registerSettings(){
var darkmode = barn.get("setting_darkmode") || false,
 autorefresh = barn.get("setting_refresh") || false;
 
$('[data-action=darkmode]').prop("checked",darkmode);
$('[data-action=autorefresh]').prop("checked",autorefresh);

 $("input[class='setting']").on("change", function() {
	 var action = $(this).attr("data-action");	
		if (action == "darkmode"){
			darkmode = !darkmode;
			   barn.set("setting_darkmode",darkmode);
			   checkdarkmode();
		}
		else if (action == "autorefresh"){
			autorefresh = !autorefresh;
			   barn.set("setting_refresh",autorefresh); 
			   registerSlider();
			   	if (!autorefresh){
				  barn.set("setting_interval", 10);	  
				}
		}
		
			$(".container").toggle(autorefresh);
 });
 $(".container").toggle(autorefresh);
 barn.condense();
} 

/* this function handles the managing of misc settings and the interval slider */
function registerSlider (){
  var interval = barn.get("setting_interval") || 10;

   $('.range-slider').empty();
   $('.range-slider').append(`<input class="range-slider__range" type="range" value="${interval}" min="5" max="60"><span class="range-slider__value">0</span>`);
   
  var slider = $('.range-slider'),
range = $('.range-slider__range'),
value = $('.range-slider__value'); 
   
  slider.each(function(){	  
    value.each(function(){
	  var value = $(this).prev().attr('value');
      $(this).html(interval + " s");
    });	
	
    range.on('input', function(){
      $(this).next(value).html(this.value  + " s"); 
    });	
	
	range.on('mouseup touchend', function(){
      barn.set("setting_interval",this.value)
    });	
  });  
} 
