
class DlUi
{
  constructor() {

  }

  btnConnection(elem, text) {
    console.log('btn:Connection');
    if (elem != null)
    {
      elem.innerHTML=text;
    }
  };

  btnRemoveModeButtons() {
    console.log('btn:RemoveModeButtons');
    var btns = document.getElementsByName("modeButton");
    var i;
    var length = btns.length;
    for (i = 0; i < length; i++) {
      btns[0].remove();
    }
  }

  btnColorModeButton(number) {
    //console.log('btn:ColorModeButton (' + number + ')');
    var btns = document.getElementsByName("modeButton");
    var i;
    for (i = 0; i < btns.length; i++) {
        if (parseInt(btns[i].attributes.id.nodeValue) == number) {
            btns[i].className = "btn btn-warning";
        }
        else {
            btns[i].className = "btn btn-info";
        }
    }
  }

  btnCreateButton(number, name) {
    console.log('btn:ColorModeButton (' + number + ', ' + name + ')');
    var r = $('<input/>').attr({
                type: "button",
                id: number,
                name: "modeButton",
                value: name,
                class:"btn btn-info",
                onclick: "newButtonClickListener(this.id, this.value)"
            });
            $("body").append(r);
  }



}

