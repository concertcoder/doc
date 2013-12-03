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
		
		}, this);
		
		loadDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors+'/'+btoa(email));
			$doctorRef.on('value', $.proxy(function(snapshot){
				console.log('Load attempt');
				if(snapshot.val() === null){
					createDoctor();
				} else {
					this.doctor = snapshot.val();
					//loadManagementScreen();
				}
			}, this));
		}, this);
		
		createDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors);
				$newDoc = $doctorRef.child(btoa(email))
				docTemplate = {email: this.email, first_name:'', last_name: '', address: '', phone: '', birthday: '', profession: ''};
				
			$newDoc.set(docTemplate);
			this.doctor = docTemplate;
		}, this);
		
		validateEmail = function(email){
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		}
		
		ManageDoctor.defaultConfig = {
			'elements' : {
				'login' : {
					'email': '#login-page .info .email',
					'submit' : '#login-page .info .submit-data'
				},
				'submitData' : '.submit-data'
			},
			'firebase' : {
				'doctors' : 'https://concertcoder.firebaseio.com/doctors'
			}
		};
		
		initialize();
	}
}(window.jQuery));