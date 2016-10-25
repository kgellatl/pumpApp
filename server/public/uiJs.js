      $('.BSswitch').bootstrapSwitch('state', true);
      
      $('#pauseResume').click(function () {
         var pList = ["beadPump", "rtPump","cellPump","oilPump"];
         var pID = ["BP", "RP","CP","OP"];     // pump mapping
         $('.BSswitch ').bootstrapSwitch('toggleDisabled');
    
         if ($(this).text()=='Pause All') {
            // Pause All:
            $(this).text('Resume All');
            $(this).removeClass('red');     
            $(this).addClass('green');
            // Send STP to all pumps:
            for (i=0; i<pList.length; i++) {
               var thing = document.getElementById(pList[i]);
               if ($(thing).bootstrapSwitch('state')) {
               // Send RUN to pumps that should be running:
               MsgSend(pID[i],'STP');
               }
            }
    
         } else {
            // Resume All:
            $(this).text('Pause All');
            $(this).removeClass('green');     
            $(this).addClass('red');     
            // Send RUN to all pumps in "Running" mode:
            for (i=0; i<pList.length; i++) {
               var thing = document.getElementById(pList[i]);
               if ($(thing).bootstrapSwitch('state')) {
               // Send RUN to pumps that should be running:
               MsgSend(pID[i],'RUN');
               }
            }
         }
       });
       <!-- pump on/off toggle switch handler -->
        $('.BSswitch').on('switchChange.bootstrapSwitch', function () {
          <!--   toggle switch action code goes here -->
          if ($(this).bootstrapSwitch('state')) {
             MsgSend($(this).val(),'RUN');
          } else {
             MsgSend($(this).val(),'STP');
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
        
        <!-- Inc/Dec button handler -->
        $('.btn').on('click', function () {
          MsgSend(this.id,"");
        });
        <!-- form-control handler -->
        $('.form-control').on('keypress', function (e) {
          if (e.which == 13) {   <!-- Enter key -->
             switch ($(this)[0].id) {
                case "beadSyringe":
                   MsgSend("BS",$(this).val());
                   break;
                case "rtSyringe":
                   MsgSend("RS",$(this).val());
                   break;
                case "cellSyringe":
                   MsgSend("CS",$(this).val());
                   break;
                case "oilSyringe":
                   MsgSend("OS",$(this).val());
                   break;
                case "beadRate":
                   MsgSend("BR",$(this).val());
                   break;
                case "rtRate":
                   MsgSend("RR",$(this).val());
                   break;
                case "cellRate":
                   MsgSend("CR",$(this).val());
                   break;
                case "oilRate":
                   MsgSend("OR",$(this).val());
              }
          }
        });
        
        //run mode radio buttons handlers 
        $('#runModeGroup input').on('change', function() {
        var $btnSource = $('input[name="runMode"]:checked', '#runModeGroup').val();
        switch($btnSource) {
           case "primeBeads":
              MsgSend("MB","");
              break;
           case "primeOther":
              MsgSend("MO","");
              break;
           case "packBeads":
              MsgSend("MP","");
              break;
           case "run":
              MsgSend("MR","");
              break;
           default:
              MsgSend("MM","");
        }
        });
        <!--- Stirrer slider -->
        $("#stirrer").slider();
        $("#stirrer").on("slide", function(slideEvt) {
        $("#stirrerSliderVal").text(slideEvt.value);
        });