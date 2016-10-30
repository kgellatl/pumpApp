      var socket = io.connect('http://localhost:8080');

      socket.on('accVolReading', function (data) {
          var pumpName = data.pumpName;
          var accVol = data.accVol;
          $('#' + pumpName + 'accVol').val(accVol);
      });

      $('.BSswitch').bootstrapSwitch('state', true);
      
      $('#pauseResume').click(function () {
         $('.BSswitch ').bootstrapSwitch('toggleDisabled');
    
         if ($(this).text()=='Pause All') {
            // Pause All:
            $(this).text('Resume All');
            $(this).removeClass('red');     
            $(this).addClass('green');
            $.post('pumps/stopAll');
            }
    
            else {
            // Resume All:
            $(this).text('Pause All');
            $(this).removeClass('green');     
            $(this).addClass('red');     
            $.post('pumps/runAll');
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
        
        $('#pumpAdditionForm').submit(function(event){
            event.preventDefault();
            var driverCode = $(this).find('input[name=driverCode]').val()
            var pumpName = $(this).find('input[name=pumpName]').val()
            $.post("pumps/add",{pump_name: pumpName, driver_code: driverCode})
            location.reload();   
        })
        
        $('.pumpDelete').on('click',function(){
            var pumpName = this.name;
            $.post("pumps/delete",{pump_name: pumpName});
            location.reload();
        })
        
        $('.modeDelete').on('click',function(){
            var modeName = this.name;
            $.post("modes/delete",{mode_name:modeName});
            location.reload();
        })
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
        })
        
        <!-- form-control handler -->
        $('.form-control').on('keypress', function (e) {
          if (e.which == 13) {   <!-- Enter key -->
             var pumpName = this.name;
             var diam = $(this).val();
             $.post()
          }
        });
        
        //run mode radio buttons handlers 
        $('#runModeGroup input').on('change', function() {
        var groupName = this.value;
        $.post('pumps/run/' + groupName);
        });
        
        <!--- Stirrer slider -->
        $("#stirrer").slider();
        $("#stirrer").on("slide", function(slideEvt) {
        $("#stirrerSliderVal").text(slideEvt.value);
        });
        $("#stirrer").on("slideStop", function(slideEvt) {
          socket.emit('motorChange',{rate: slideEvt.value});
        });