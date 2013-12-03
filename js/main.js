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
		
			// Whenever the enter key is pressed, try and find the adjacent submit button and trigger it
			$('input').on('keydown', $.proxy(function(e){
				if(e.keyCode === 13){
					$(e.currentTarget).siblings(this.config.elements.submitData).trigger('click');
				}
			}, this));
		
			$(this.config.elements.login.submit).on('click', $.proxy(function(){
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
		
		}, this);
		
		loadDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors+'/'+btoa(email));
			$doctorRef.on('value', $.proxy(function(snapshot){
				if(snapshot.val() === null){
					createDoctor();
				} else {
					this.doctor = snapshot.val();
					loadManagementScreen();
				}
			}, this));
		}, this);
		
		createDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors);
				$newDoc = $doctorRef.child(btoa(email))
				docTemplate = {email: this.email, first_name:'', last_name: '', address: '', phone: '', birthday: '', profession: ''};
				
			$newDoc.set(docTemplate);
			this.doctor = docTemplate;
			loadManagementScreen();
			
		}, this);
		
		loadManagementScreen = $.proxy(function(email){
			if(this.doctor.last_name.length>0){
				$(this.config.elements.genericFields.lastName).html(this.doctor.last_name);
			} else {
				$(this.config.elements.genericFields.lastName).html('N/A');
			}
			
			$(this.config.elements.login.container).hide();
			$(this.config.elements.manage.container).show();
			
		}, this);
		
		validateEmail = function(email){
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		}
		
		ManageDoctor.defaultConfig = {
			'elements' : {
				'login' : {
					'container' : '#login-page',
					'email': '#login-page .info .email',
					'submit' : '#login-page .info .submit-data'
				},
				'manage' : {
					'container' : '#manage-doctor-assets',
					'tabs' : {
						'profile' : '#profile',
						'bookings' : '#bookings',
						'schedule' : '#schedule',
						'generic' : '.doctor-tab-data'
					}
				},
				'submitData' : '.submit-data',
				'mainTabs' : '.navigate-tab',
				'genericFields' : {
					'lastName' : '.doctor-last-name'
				}
			},
			'firebase' : {
				'doctors' : 'https://concertcoder.firebaseio.com/doctors'
			}
		};
		
		initialize();
	}
}(window.jQuery));