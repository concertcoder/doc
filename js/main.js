(function ($){
	window.ManageDoctor = function(options) {
		var initialize = null,
			initEvents = null,
			initDom = null
			validateEmail = null;
	
		this.config = null;
		this.email = null;
		this.doctor = null;
		
		initialize = $.proxy(function(){
			this.config = $.extend(true, ManageDoctor.defaultConfig, options);
			initEvents();
		}, this);
		
		initEvents = $.proxy(function(){
		
			$('.logout').on('click', $.proxy(function(e){
				location.reload();
			}, this));
		
			// Whenever the enter key is pressed, try and find the adjacent submit button and trigger it
			$('input').on('keydown', $.proxy(function(e){
				var $submitEl = null;
				if(e.keyCode === 13){
					$submitEl = $(e.currentTarget).prevAll(this.config.elements.submitData).first();
					
					if($submitEl.length){
						$submitEl.trigger('click.submit');
					} else {
						$submitEl = $(e.currentTarget).nextAll(this.config.elements.submitData).first().trigger('click.submit');
					}
					
					
				}
			}, this));
		
			$(this.config.elements.login.submit).on('click.submit', $.proxy(function(){
				var $email = $(this.config.elements.login.email),
					email = $email.val();
				
				// Email must exist and be valid
				if(email.length > 0 && validateEmail(email)){
					$email.removeClass('invalid');
					this.email = email;
					
					loadDoctor(email);
				} else {
					$email.addClass('invalid');
				}
				
			}, this));
			
			$(this.config.elements.mainTabs).on('click', $.proxy(function(e){
				$el = $(e.currentTarget);
				
				if(!$el.hasClass('active')){
					$(this.config.elements.mainTabs).parent().removeClass('active');
					$el.parent().addClass('active');
					$(this.config.elements.manage.tabs.generic).removeClass('active');
					$('#'+$el.data().id).addClass('active');
				}
			}, this));
			
			$(this.config.elements.profile.editField).on('click.edit', $.proxy(function(e){
				var $el = $(e.currentTarget),
					$p = $el.nextAll('p').first(),
					$input = $el.nextAll('input').first();
				
				$el.removeClass('glyphicon-pencil');
				$el.addClass('glyphicon-ok');
				
				$p.hide();
				$input.show();
				
				$el.on('click.submit', $.proxy(function(e){
					var $el = $(e.currentTarget),
						$p = $el.nextAll('p').first(),
						$input = $el.nextAll('input').first();

					if($input.val().length){
						if($p.find('img').length){
							$p.find('img').attr('src', $input.val())
						} else {
							$p.text($input.val());
						}
						
						updateDoctorField($input.data().id, $input.val());
						$input.removeClass('invalid');
						$el.removeClass('glyphicon-ok');
						$el.addClass('glyphicon-pencil');
						$el.unbind('click.submit');
						$input.hide();						
						$p.show();
					} else {
						$input.addClass('invalid');
					}
				}, this));
			}, this));
		
		}, this);
		
		updateDoctorField = $.proxy(function(id, val){
			var $doctorRef = new Firebase(this.config.firebase.doctors+'/'+btoa(this.doctor.email));
			this.doctor[id] = val;
			$doctorRef.set(this.doctor);
		}, this);
		
		loadDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors+'/'+btoa(email));
			$doctorRef.on('value', $.proxy(function(snapshot){
				if(snapshot.val() === null){
					createDoctor(email);
				} else {
					this.doctor = snapshot.val();
					loadManagementScreen();
				}
			}, this));
		}, this);
		
		createDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors);
				$newDoc = $doctorRef.child(btoa(email))
				docTemplate = this.config.doctorTemplate;
				
			docTemplate.email = email;
				
			$newDoc.set(docTemplate);
			this.doctor = docTemplate;
			loadManagementScreen();
		}, this);
		
		loadManagementScreen = $.proxy(function(){

			// Set the page data 
			$.each(this.doctor, $.proxy(function(idx, val){
				var textVal = val
				if(!textVal.length){
					textVal = "N/A";
				}
				
				$('span'+this.config.elements.genericFields[idx]).text(textVal);
				$('p'+this.config.elements.genericFields[idx]).text(textVal);
				$('img'+this.config.elements.genericFields[idx]).attr('src', val);
				
				$('input'+this.config.elements.genericFields[idx]).val(val);
			}, this));
			
			
			$(this.config.elements.login.container).hide();
			$(this.config.elements.manage.container).show();
			
		}, this);
		
		validateEmail = function(email){
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		}
		
		ManageDoctor.defaultConfig = {
			elements : {
				login : {
					container : '#login-page',
					email: '#login-page .info .email',
					submit : '#login-page .info .submit-data'
				},
				manage : {
					container : '#manage-doctor-assets',
					tabs : {
						profile : '#profile',
						bookings : '#bookings',
						schedule : '#schedule',
						generic : '.doctor-tab-data'
					}
				},
				profile : {
					editField: '#manage-doctor-assets #profile .glyphicon-pencil',
					saveField: '#manage-doctor-assets #profile .glyphicon-ok',
					avatar: '#manage-doctor-assets #profile #doctor-image img'
				},
				submitData : '.submit-data',
				mainTabs : '.navigate-tab',
				genericFields : {
					email: '.doctor.email',
					lastName: '.doctor.last-name', 
					address: '.doctor.address', 
					phone: '.doctor.phone', 
					birthday: '.doctor.birthday', 
					profession: '.doctor.profession', 
					education: '.doctor.education',
					avatar: '.doctor.avatar'
				}
			},
			firebase : {
				'doctors' : 'https://concertcoder.firebaseio.com/doctors'
			},
			doctorTemplate : {
				email: '',
				lastName: '', 
				address: '', 
				phone: '', 
				birthday: '', 
				profession: '', 
				education: '',
				avatar: 'img/default-avatar.png'
			}
		};
		
		initialize();
	}
}(window.jQuery));