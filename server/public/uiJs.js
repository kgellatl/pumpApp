      var socket = io.connect('http://localhost:8080');

      socket.on('accVolReading', function (data) {
          var pumpName = data.pumpName;
          var accVol = data.accVol;
          $('#' + pumpName + 'accVol').val(accVol);
      });

      $('.BSswitch').bootstrapSwitch('state', false);

      $('#switchCellPump').click(function(){
          $('.BSswitch[name=cells1]').bootstrapSwitch('toggleState');
          $('.BSswitch[name=cells2]').bootstrapSwitch('toggleState');
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
              $('#' + pumpName + 'Rate').attr("disabled",false);
              $('#' + pumpName + 'Syringe').attr("disabled",false);
              $.post('pumps/run/' + pumpName);
          } else {
              $('#' + pumpName + 'Rate').attr("disabled",true);
              $('#' + pumpName + 'Syringe').attr("disabled",true);
              $.post('pumps/stop/' + pumpName);
          }
        
        });
        
        $('#pumpAdditionForm').submit(function(event){
            event.preventDefault();
            var driverCode = $(this).find('input[name=driverCode]').val()
            var pumpName = $(this).find('input[name=pumpName]').val()
            $.post("pumps/add",{pump_name: pumpName, driver_code: driverCode})
            location.reload();   
        });

        $('.volClear').on('click',function(){
          var pumpName = this.name;
          $.post("pumps/volClear",{pump_name: pumpName});
          $(this).prev().val(0);
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
        
        <!-- form-control handler -->
        $('.diamChange').on('keypress', function (e) {
          if (e.which == 13) {   <!-- Enter key -->
             var pumpName = this.name;
             var diam = $(this).val();
             $.post("pumps/updateSyringe",{pumpName:pumpName,syringeDiam:diam});
              location.reload();
          }
        });

      <!-- form-control handler -->
      $('.rateChange').on('keypress', function (e) {
          if (e.which == 13) {   <!-- Enter key -->
              var pumpName = this.name;
              var rate = $(this).val();
              $.post("pumps/updateRate",{pumpName:pumpName,rate:rate});
              location.reload();
          }
      });

        //run mode radio buttons handlers
        $('.radio').find("input").on('change', function() {
            if(this.checked) {
                $('.BSswitch ').bootstrapSwitch('state', false, false);
                var groupName = this.value;
                $.post('modes/run/' + groupName, function (data) {
                    data.pumps.forEach(function (element) {
                        $('.BSswitch[name=' + element.pumpName + ']').bootstrapSwitch('state', true, false);
                        $('#' + element.pumpName + 'Rate').val(element.rate);
                    })
                })
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