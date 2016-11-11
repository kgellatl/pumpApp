//setup open tcpsocket for constant volume accumulation updates as well as stirrer motor rate changes
var socket = io.connect('http://192.168.0.102:8090');

//initialize pump switches to off
window.pumps.forEach(function(pump){
    var state = (pump.isRunning==1)?true:false;
    $('.BSswitch[name=' + pump.pump_name + ']').bootstrapSwitch('state', state);
    });


//when switchCellPump is clicked, toggle the states of the cell pumps
var cells1,cells2;
$('#switchCellPump').click(function(){
    cells1 = (cells1)?cells1:$('.BSswitch[name=cells1]');
    cells2 = (cells2)?cells2:$('.BSswitch[name=cells2]');
    if((cells1.prop("checked") || cells2.prop("checked")) &&!(cells1.prop("checked") && cells2.prop("checked"))) {
        $('.BSswitch[name=cells1]').bootstrapSwitch('toggleState');
        $('.BSswitch[name=cells2]').bootstrapSwitch('toggleState');
    }
});

//On a volume accumulation reading event, make sure to update the appropriate html element
socket.on('accVolReading', function (data) {
    var pumpName = data.pumpName;
    var accVol = data.accVol;
    $("[id='" + pumpName + "accVol']").val(accVol);
});

var paused;
/*
Whenever the pause/resume button is clicked set the pump switches to off/on respectively
 */
$('#pauseResume').click(function () {

    if ($(this).text()=='Pause All') {
        // Pause All:
        $(this).text('Resume All');
        $(this).removeClass('red');
        $(this).addClass('green');
        paused = $('.BSswitch:checked');
        paused.bootstrapSwitch('state',false,false);
    }

    else {
        // Resume All:
        $(this).text('Pause All');
        $(this).removeClass('green');
        $(this).addClass('red');
        paused.bootstrapSwitch('state',true,false);
    }
});


/*
    When a switch is toggled make sure to send either a run/stop request for that pump to the backedn
 */
$('.BSswitch').on('switchChange.bootstrapSwitch', function () {
    <!--   toggle switch action code goes here -->
    var pumpName = this.name;
    var state = $(this).bootstrapSwitch('state')
    if (state) {
        $('#pauseResume').text('Pause All');
        $('#pauseResume').removeClass('green');
        $('#pauseResume').addClass('red');
        $.post('pumps/run/' + pumpName);
    } else {
        $.post('pumps/stop/' + pumpName);
    }

});

/*
    When enter is pressed on a rate change input form, make sure to send a request to the backend to update the rate for the pump that that input form corresponds to
 */
$('.rateChange').on('keypress', function (e) {
    if (e.which == 13) {   <!-- Enter key -->
        var pumpName = this.name;
        var rate = $(this).val();
        $.post("pumps/updateRate",{pumpName:pumpName,rate:rate});
    }
});

/*
 When a runmode is selected: first, set all the pumps to stopped, then, get all the rates for said run mode, then, update the rate for each pump, and finally make sure to switch the pump to on. It is important to
 wait in between sending the rate change command for a pump and telling it to run.
 */
$('.radio').find("input").on('change', function() {
    if(this.checked) {
        $('.BSswitch ').bootstrapSwitch('state', false, false);
        var groupName = this.value;
        $.get('modes/get/' + groupName, function (data) {
            data.forEach(function (element) {
                $.post("pumps/updateRate", {pumpName: element.pumpName, rate: element.rate}).done(function (data) {
                    setTimeout(function() {
                        $('.BSswitch[name=' + element.pumpName + ']').bootstrapSwitch('state', true, false);
                        $('#' + element.pumpName + 'Rate').val(element.rate);
                    },3000);
                });
            })
        })
    }
});

<!--- Stirrer slider -->
$("#stirrer").slider();
$("#stirrer").on("slide", function(slideEvt) {
    $("#stirrerSliderVal").text(slideEvt.value);
});
/*
    Send the motorChange event to the backend via the open tcp socket, with the corresponding rate you want it changed to
 */
$("#stirrer").on("slideStop", function(slideEvt) {
    var motorNo = 1;
    var state = $('.BSswitch[name=cells2]').bootstrapSwitch('state')
    if(state){
        motorNo=2;
    }
    socket.emit('motorChange',{rate: slideEvt.value,motorNo: motorNo});
});

/*
    Send a volume clear request to the backend for the corresponding pump that the volume clear button belongs to
 */
$('.volClear').on('click',function(){
    var pumpName = this.name;
    $.post("pumps/volClear",{pump_name: pumpName});
    $(this).prev().val(0);
});


<!--- Admin Code -->

/*
When the pump submission button is clicked, gather the data for the pump, then send a request with said data to the backend, so that a record can be created for said pump
 */
$('#pumpAdditionForm').submit(function(event){
    event.preventDefault();
    var driverCode = $(this).find('input[name=driverCode]').val()
    var pumpName = $(this).find('input[name=pumpName]').val()
    var defaultRate = $(this).find('input[name=defaultRate]').val()
    var syringeDiam = $(this).find('input[name=syringeDiam]').val()
    $.post("pumps/add",{pump_name: pumpName, driver_code: driverCode, syringe_diam:syringeDiam,default_rate:defaultRate})
    location.reload();
});


$('.pumpDelete').on('click',function(){
    var pumpName = this.name;
    $.post("pumps/delete",{pump_name: pumpName});
    location.reload();
});

$('.modeDelete').on('click',function(){
    var modeName = this.name;
    $.post("modes/delete",{mode_name:modeName});
    location.reload();
});

/*
    Handle creation of a runmode on the backend, by collecting the pumps and rates that were input in the form for said run mode, then sending that to the server in the request.
 */
$('#runModeAdditionForm').submit(function(event){
    event.preventDefault();
    var runModeName = $(this).find('input[name="runModeName"]').val();
    var checked = $(this).find('input:checked').map(function(){
        return this.name
    }).get();
    var requestJson = {};
    for(var i =0; i<checked.length;i++){
        var pumpName = checked[i];
        var rate = $('#runModeAdditionForm').find('input[name="' + pumpName + 'Rate"]').val();
        requestJson[pumpName]=rate
    }
    requestJson["mode_name"]=runModeName;
    $.post("modes/add",requestJson);
    location.reload();
});
