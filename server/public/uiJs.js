var socket = io.connect('http://192.168.0.102:8090');


$('.BSswitch').bootstrapSwitch('state', false);

$('#switchCellPump').click(function(){
    $('.BSswitch[name=cells1]').bootstrapSwitch('toggleState');
    $('.BSswitch[name=cells2]').bootstrapSwitch('toggleState');
});

socket.on('accVolReading', function (data) {
    var pumpName = data.pumpName;
    var accVol = data.accVol;
    $('#' + pumpName + 'accVol').val(accVol);
});

$('#pauseResume').click(function () {

    if ($(this).text()=='Pause All') {
        // Pause All:
        $(this).text('Resume All');
        $(this).removeClass('red');
        $(this).addClass('green');
        $('.BSswitch ').bootstrapSwitch('state',false,false);
    }

    else {
        // Resume All:
        $(this).text('Pause All');
        $(this).removeClass('green');
        $(this).addClass('red');
        $('.BSswitch ').bootstrapSwitch('state',true,false);
    }
});


<!-- pump on/off toggle switch handler -->
$('.BSswitch').on('switchChange.bootstrapSwitch', function () {
    <!--   toggle switch action code goes here -->
    var pumpName = this.name;
    if ($(this).bootstrapSwitch('state')) {
        $.post('pumps/run/' + pumpName);
    } else {
        $.post('pumps/stop/' + pumpName);
    }

});


<!-- form-control handler -->
$('.rateChange').on('keypress', function (e) {
    if (e.which == 13) {   <!-- Enter key -->
        var pumpName = this.name;
        var rate = $(this).val();
        $.post("pumps/updateRate",{pumpName:pumpName,rate:rate});
    }
});

//run mode radio buttons handlers
$('.radio').find("input").on('change', function() {
    if(this.checked) {
        $('.BSswitch ').bootstrapSwitch('state', false, false);
        var groupName = this.value;
        setTimeout(function() {
            $.get('modes/get/' + groupName, function (data) {
                data.forEach(function (element) {
                    $.post("pumps/updateRate", {pumpName: element.pumpName, rate: element.rate}).done(function (data) {
                        $('.BSswitch[name=' + element.pumpName + ']').bootstrapSwitch('state', true, false);
                        $('#' + element.pumpName + 'Rate').val(element.rate);
                    });
                })
            })
        },3000);
    }
});

<!--- Stirrer slider -->
$("#stirrer").slider();
$("#stirrer").on("slide", function(slideEvt) {
    $("#stirrerSliderVal").text(slideEvt.value);
});
$("#stirrer").on("slideStop", function(slideEvt) {
    socket.emit('motorChange',{rate: slideEvt.value});
});

$('.volClear').on('click',function(){
    var pumpName = this.name;
    $.post("pumps/volClear",{pump_name: pumpName});
    $(this).prev().val(0);
});


<!--- Admin Code -->

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
