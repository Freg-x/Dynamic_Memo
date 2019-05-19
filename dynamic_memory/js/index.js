var DEBUG_MODE = true;

//定义常变量

var MEMO_SIZE = 640; //内存大小
var FIND_QUICK = 0; //代表首次适应的编号
var FIND_BEST = 1; //代表最佳适应的编号


//定义全局变量

var running_block = []; //运行着的内存块
var current_id = 1; //当前插入的块的id
var vacant_block = [640]; //代表空块的数组

//使用js模拟一个结构体
//给出相关参数在runnning_block内创造一个相应结构体

function createBlock(start, end, id) {
  var text, p;
  var block = [];
  block.start = parseInt(start);
  block.end = parseInt(end);
  block.id = id;
  block.length = end - start;

  return block;

}


//初始化函数(其实就是一个添加滚动条)

function init() {
  $("#info").mCustomScrollbar({

  });
 
}


$(document).ready(init);





//This is the Main Part



//不仅在内存中创建一个块
//也要在浏览器中进行添加
//三个参数分别代表插入块的id,长度和起始地址

function createMission(id, length, start) {

  var new_block = document.createElement("div");
  var new_des = document.createElement("div");
  var new_del = document.createElement("div");



  new_des.className = "description";
  new_des.innerHTML = "任务 " + id + "&nbsp;&nbsp;" + length + " kB";


  new_del.className = "delete";
  new_del.innerHTML = "删除该任务";
  new_del.onclick = del; //点击时对应删除的函数

  new_block.className = "mission";
  new_block.id = "mission" + id;
  new_block.style.width = length * 2 + "px";
  new_block.style.fontSize = length / 25 + "px"; //提示的字体会随着长度的变化而变化
  new_block.style.left = start * 2 + "px"; //在这里对长度进行转化,因为浏览器自动内存条是1280px

  new_block.appendChild(new_des);
  new_block.appendChild(new_del);

  new_block.style.display = "none"; //为了播放小动画

  document.getElementById("main_memo").appendChild(new_block);

  //这里是将内存块插入逻辑中数组的相应位置
  //插入的位置必然是开头,或是现有内存块的结束点

  var new_obj = createBlock(start, start + length, id);
  if (start == 0) {
    running_block.unshift(new_obj);
  } else {
    for (var i = 0; i < running_block.length; i++) {
      if (start == running_block[i].end) {
        running_block.splice(i + 1, 0, new_obj);
        break;
      }
    }
  }

  $("#mission" + id).fadeIn(); //小动画




}




//在点击创造时的相应函数



$("#create").click(function() {

  //创建提示信息变量,获取插入块的大小和使用的算法

  var text, p, i;
  var size = parseInt(document.getElementById("size").value);
  var select = document.getElementById("algorithm");
  var algorithm = select.selectedIndex;


  //第一个if,判断输入合法性

  if (size > 0) {
    var start_id = algorithm == FIND_BEST ? findBest(size) : findQuick(size); //代表用两种方式获取起始地址

    //第二个if,判断内存是否还有空间
    if (start_id != -1) {
      createMission(current_id++, size, start_id);
      var chinese = algorithm == FIND_BEST ? "最佳适应算法" : "首次适应算法";
      text = "使用 " + chinese + " 创建了大小为 " + size + " kB的内存块";
      p = $("<p></p>").text(text);
      $(".mCSB_container").append(p);

      text = "当前空闲块情况: ";
      updateVacant();
      for (i = 0; i < vacant_block.length; i++) {
        text = text + vacant_block[i] + " kB ";
      }
      p = $("<p></p>").text(text);
      $(".mCSB_container").append(p);




      $("#info").mCustomScrollbar("scrollTo", "last");
    } else {
      text = "内存无法容纳当前大小的内存块,请尝试清理后插入";
      p = $("<p></p>").text(text);
      $(".mCSB_container").append(p);

      text = "当前空闲块情况: ";
      updateVacant();
      for (i = 0; i < vacant_block.length; i++) {
        text = text + vacant_block[i] + " kB ";
      }
      p = $("<p></p>").text(text);
      $(".mCSB_container").append(p);

      $("#info").mCustomScrollbar("scrollTo", "last");

    }

  } else {

    text = "该内存块大小为无效值";
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);

    text = "当前空闲块情况: ";
    updateVacant();
    for (i = 0; i < vacant_block.length; i++) {
      text = text + vacant_block[i] + " kB ";
    }
    p = $("<p></p>").text(text);
    $(".mCSB_container").append(p);


    $("#info").mCustomScrollbar("scrollTo", "last");

  }

});


//处理删除事件的函数



function del() {
  var this_id = $(this).parent()[0].id;
  var id = this_id.substr(7);
  var size;
  //在数组中找到对应id的块进行删除

  for (var i = 0; i < running_block.length; i++) {
    if (running_block[i].id == id) {
      size = running_block[i].length;
      running_block.splice(i, 1);
      break;
    }
  }

  var parent = $(this).parent(); //小动画
  parent.fadeOut(function() {
    parent.remove();
  });

  var text = "结束了 " + id + " 号任务, 释放了 " + size + " kB的内存空间"; //提示信息
  var p = $("<p></p>").text(text);
  $(".mCSB_container").append(p);

  text = "当前空闲块情况: ";
  updateVacant();
  for (var i = 0; i < vacant_block.length; i++) {
    text = text + vacant_block[i] + " kB ";
  }
  p = $("<p></p>").text(text);
  $(".mCSB_container").append(p);


  $("#info").mCustomScrollbar("scrollTo", "last");

}


//首次适应算法
//从低地址向上寻找,一但有空间立刻插入

function findQuick(size) {
  if (running_block.length == 0) { //空内存时,特殊讨论
    return size <= MEMO_SIZE ? 0 : -1;
  } else {

    if (running_block[0].start >= size) return 0; //首个位置
    for (var i = 1; i < running_block.length; i++) {
      if (running_block[i].start - running_block[i - 1].end >= size) return running_block[i - 1].end;

    } //块间位置


    if (MEMO_SIZE - running_block[i - 1].end >= size) return running_block[i - 1].end; //最末位置


  }
  return -1; //都没有返回,代表内存已满

}


//最佳适应算法,一定要找到最小但空闲区才插入


function findBest(size) {
  if (running_block.length == 0) {
    return size <= MEMO_SIZE ? 0 : -1; //空内存块特殊分类
  } else {
    var min_vacant = 999; //假定当前但最小内存块长度
    var vacant_pos; //当前最小块对应但起始位置

    //类似首次适应算法,只不过找到合法位置后会和最小内存块长度进行比较,并实时更新并记录最小块对应但插入位置

    if (running_block[0].start >= size) {
      min_vacant = running_block[0].start;
      vacant_pos = 0;
    }
    for (var i = 1; i < running_block.length; i++) {
      if (running_block[i].start - running_block[i - 1].end >= size && running_block[i].start - running_block[i - 1].end < min_vacant) {
        min_vacant = running_block[i].start - running_block[i - 1].end;
        vacant_pos = running_block[i - 1].end;
      }
    }
    if (MEMO_SIZE - running_block[i - 1].end >= size && MEMO_SIZE - running_block[i - 1].end < min_vacant) {
      min_vacant = MEMO_SIZE - running_block[i - 1].end;
      vacant_pos = running_block[i - 1].end;
    }
    if (min_vacant == 999) return -1; //最后,如果最小块的长度还没有被更新,代表内存已满
    else return vacant_pos; //否则,返回一个插入位置,即插入块的起始地址



  }


}

//更新空块
function updateVacant() {

  if (running_block.length == 0) { //空内存时,特殊讨论
    vacant_block = [640];
  } else {
    vacant_block = [];

    if (running_block[0].start > 0) vacant_block.push(running_block[0].start); //首个位置
    for (var i = 1; i < running_block.length; i++) {
      if (running_block[i].start - running_block[i - 1].end > 0) vacant_block.push(running_block[i].start - running_block[i - 1].end);

    } //块间位置


    if (MEMO_SIZE - running_block[i - 1].end > 0) vacant_block.push(MEMO_SIZE - running_block[i - 1].end); //最末位置


  }



}
