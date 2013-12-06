// Author: Meizz
// Simple format date functions
function formatDate(date, format)
{
  var o = {
    "M+" : date.getMonth()+1, //month
    "d+" : date.getDate(),    //day
    "h+" : date.getHours(),   //hour
    "m+" : date.getMinutes(), //minute
    "s+" : date.getSeconds(), //second
    "q+" : Math.floor((date.getMonth()+3)/3),  //quarter
    "S" : date.getMilliseconds() //millisecond
  }

  if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
    (date.getFullYear()+"").substr(4 - RegExp.$1.length));
  for(var k in o)if(new RegExp("("+ k +")").test(format))
    format = format.replace(RegExp.$1,
      RegExp.$1.length==1 ? o[k] :
        ("00"+ o[k]).substr((""+ o[k]).length));
  return format;
}

// Manage Doctor Object
(function ($){
	window.ManageDoctor = function(options) {
		var initialize = null,
			initEvents = null,
			initDom = null
			validateEmail = null;
	
		// Config is used for configurations
		this.config = null;
		// Doctor's email
		this.email = null;
		// Doctor's profile info
		this.doctor = null;
		// All of the booking requests at time of sign in
		this.bookingRequests = Array();
		
		// Main initializer
		initialize = $.proxy(function(){
			this.config = $.extend(true, ManageDoctor.defaultConfig, options);
			initEvents();
		}, this);
		
		// Initializes load time events
		initEvents = $.proxy(function(){
		
			// Logout scenario
			$('.logout').on('click', $.proxy(function(e){
				location.reload();
				createBookingRequest();
			}, this));
			
			// Close navbar drop down for mobile on click
			$('.nav a').on('click', function(){
				$("button.navbar-toggle").click();
			});
		
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
		
			// Login submssion
			$(this.config.elements.login.submit).on('click.submit', $.proxy(function(e){
				var $email = $(this.config.elements.login.email),
					email = $email.val(),
					$el = $(e.currentTarget);
				
				// Easy way to avoid double submissions
				if($el.hasClass('submitting')){
					return;
				} else {
					$el.addClass('submitting');
				}

				// Email must exist and be valid
				if(email.length > 0 && validateEmail(email)){
					$email.removeClass('invalid');
					this.email = email;
					
					loadDoctor(email);
				} else {
					$email.addClass('invalid');
				}
				
			}, this));
			
			// Setting up main tabs toggling
			$(this.config.elements.mainTabs).on('click', $.proxy(function(e){
				$el = $(e.currentTarget);
				
				if(!$el.hasClass('active')){
					$(this.config.elements.mainTabs).parent().removeClass('active');
					$el.parent().addClass('active');
					$(this.config.elements.manage.tabs.generic).removeClass('active');
					$('#'+$el.data().id).addClass('active');
				}
			}, this));
			
			// Setting up profile editing fields
			$(this.config.elements.profile.editField).on('click.edit', $.proxy(function(e){
				var $el = $(e.currentTarget),
					$p = $el.nextAll('p').first(),
					$input = $el.nextAll('input').first();
				
				$el.removeClass('glyphicon-pencil');
				$el.addClass('glyphicon-ok');
				
				$p.hide();
				$input.show();
				
				// On field submission
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
		
		// Updates a doctors field given the field id (name) and its value
		updateDoctorField = $.proxy(function(id, val){
			var $doctorRef = new Firebase(this.config.firebase.doctors+'/'+btoa(this.doctor.email));
			this.doctor[id] = val;
			$doctorRef.set(this.doctor);
		}, this);
		
		// Loads a doctor given an email
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
		
		// Creates a doctor with the config template using the email as the base element
		createDoctor = $.proxy(function(email){
			var $doctorRef = new Firebase(this.config.firebase.doctors),
				$newDoc = $doctorRef.child(btoa(email)),
				docTemplate = this.config.doctorTemplate;
				
			docTemplate.email = email;
				
			$newDoc.set(docTemplate);
			this.doctor = docTemplate;
			loadManagementScreen();
		}, this);
		
		// Used for testing, creates some mock data for booking requests
		createBookingRequest = $.proxy(function(){
			var $bookingRef = new Firebase(this.config.firebase.bookingRequests),
				$newRequest = $bookingRef.push(),
				time = new Date();
			
			// This scenario is run to have a conflicting scheduled booking
			time.setDate(time.getDate()+14);
			$newRequest.set({patientName: 'Chris Gosselin', requestTime: 1387508903989, description: 'Check up', doctor: 'greg@gmail.com'});
			time.setDate(time.getDate()+14);
			
			$newRequest = $bookingRef.push(),
			$newRequest.set({patientName: 'Ryan Lewis', requestTime: time.getTime(), description: 'Hands hurt', doctor: 'greg@gmail.com'});
			time.setDate(time.getDate()+14);
			
			$newRequest = $bookingRef.push();
			$newRequest.set({patientName: 'George Washington', requestTime: time.getTime(), description: 'Teeth Missing', doctor: 'greg@gmail.com'});
			time.setDate(time.getDate()+14);
			
			$newRequest = $bookingRef.push();
			$newRequest.set({patientName: 'Kendrick Lamar', requestTime: time.getTime(), description: 'Vocal chords', doctor: 'greg@gmail.com'});
		}, this);
		
		// Loading the booking requests
		loadBookingRequests = $.proxy(function(){
			var $bookingRef = new Firebase(this.config.firebase.bookingRequests),
				$appointmentsRef = new Firebase(this.config.firebase.appointments),
				$bookingTemplate = $(this.config.elements.bookings.requestTemplate).clone(),
				$bookingContainer = $(this.config.elements.bookings.container);
			
			// Get all the booking requests
			$bookingRef.on('value', $.proxy(function(snapshot){
			
				// Only matters if bookings exists
				if(snapshot.val() !== null){			
				
					// Save each booking that is relevant to the current doctor locally
					$.each(snapshot.val(), $.proxy(function(idx, val){
						if(val.doctor === this.email){
							val.id = idx;
							this.bookingRequests.push(val);
						}
					},this));
				
					// Need to get appointments to cross reference if there are any conflicts
					$appointmentsRef.on('value', $.proxy(function(snapshot){
						var appointments = Array();
						
						// Only matters if there are any appointments
						if(snapshot.val() !== null){
						
							// For reach appointment
							$.each(snapshot.val(), $.proxy(function(appointmentIndex, appointment){
							
								// Make sure the appointment is for this doctor
								if(appointment.doctor === this.email){
								
									// Check if any bookings conflict with the appointment time, if so set flag
									$.each(this.bookingRequests, $.proxy(function(bookingIndex, booking){
										if(appointment.requestTime <= booking.requestTime && appointment.requestTime + this.config.appointmentTime >= booking.requestTime){
											this.bookingRequests[bookingIndex].conflict = true;
										}
									}, this));
								}
							},this));
						}
						
						// Create the request object for each booking
						$bookingTemplate.removeClass('template');
						$.each(this.bookingRequests, $.proxy(function(idx, val){
							var $request = $bookingTemplate.clone(),
								date = new Date(val.requestTime);
							
							if(typeof val.conflict !== 'undefined' && val.conflict){
								$request.addClass('conflict');
							}
							
							$request.attr('data-id', val.id)
							$request.find('.patient-name').text(val.patientName);
							$request.find('.patient-appointment').text(formatDate(date, "MM/dd/yyyy h:mm"));
							$request.find('.patient-description').text(val.description);
							
							$bookingContainer.append($request);
							
						}, this));
						
						$appointmentsRef.off('value');
						
						attachBookingRequestEvents();
					}, this));

					
					$bookingRef.off('value');				
				} else {
					$(this.config.elements.bookings.noMore).show();
				}
			}, this));
		}, this);
		
		// Attaches the booking request events
		attachBookingRequestEvents = $.proxy(function(){
			$(this.config.elements.bookings.acceptBooking).on('click', $.proxy(function(e){
				var $container = $(e.currentTarget).closest(this.config.elements.bookings.request);				
				acceptBookingRequest($container.attr('data-id'));
			}, this));
			
			$(this.config.elements.bookings.rescheduleBooking).on('click', $.proxy(function(e){
				var $container = $(e.currentTarget).closest(this.config.elements.bookings.request);				
				rescheduleBookingRequest($container.attr('data-id'));
			}, this));
			
			$(this.config.elements.bookings.cancelBooking).on('click', $.proxy(function(e){
				var $container = $(e.currentTarget).closest(this.config.elements.bookings.request);				
				cancelBookingRequest($container.attr('data-id'));
			}, this));
		}, this);
		
		// Accepts a booking request
		acceptBookingRequest = $.proxy(function(bookingID){
			// Grab the node data, attach it to the doctor's appointments, remove the node
			var $bookingRef = new Firebase(this.config.firebase.bookingRequests+'/'+bookingID);
			
			$bookingRef.on('value', $.proxy(function(snapshot){
				var data = snapshot.val(),
					$appointmentsRef = new Firebase(this.config.firebase.appointments),
					$newAppointment = $appointmentsRef.push();
					
				if(data !== null){
					$newAppointment.set(data);
				}
				
				$bookingRef.off('value');
				$bookingRef.set(null);
				
				$(this.config.elements.bookings.request+'[data-id="'+bookingID+'"]').fadeOut(function(){
					$(this).remove();
					checkRequestsLeft();
				});
			}, this));
		}, this);
		
		// Cancels a booking request
		cancelBookingRequest = $.proxy(function(bookingID){
			// Grab the node data, attach it to the doctor's appointments, remove the node
			var $bookingRef = new Firebase(this.config.firebase.bookingRequests+'/'+bookingID);
			
			$bookingRef.on('value', $.proxy(function(snapshot){
				$bookingRef.off('value');
				$bookingRef.set(null);
				$(this.config.elements.bookings.request+'[data-id="'+bookingID+'"]').fadeOut(function(e){
					$(this).remove();
					checkRequestsLeft();
				});
			}, this));
		}, this);
		
		// Checks to see if any requests are left, if not shows an alert
		checkRequestsLeft = $.proxy(function(){
			var $requests = $(this.config.elements.bookings.request);
			
			if(!$requests.length){
				$(this.config.elements.bookings.noMore).show();
			}
		}, this);
		
		reschduleBookingRequest = $.proxy(function(bookingID){
			
		}, this);
		
		// Sets up the management screens
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
			
			loadBookingRequests();
			
		}, this);
		
		// validates an email
		validateEmail = function(email){
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		}
		
		// config data
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
				bookings : {
					request: '#manage-doctor-assets #bookings .request:not(.template)',
					requestTemplate: '#manage-doctor-assets #bookings .request.template',
					container: '#manage-doctor-assets #bookings .request-container',
					acceptBooking: '#manage-doctor-assets #bookings .request-container .request .accept-booking',
					rescheduleBooking: '#manage-doctor-assets #bookings .request-container .request .reschedule-booking',
					cancelBooking: '#manage-doctor-assets #bookings .request-container .request .cancel-booking',
					noMore:  '#manage-doctor-assets #bookings .request-container .no-more-requests'
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
				'doctors' : 'https://concertcoder.firebaseio.com/doctors',
				'bookingRequests' : 'https://concertcoder.firebaseio.com/bookingRequests',
				'appointments' : 'https://concertcoder.firebaseio.com/appointments'
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
			},
			appointmentTime : 1800000
		};
		
		// Start building the object
		initialize();
	}
}(window.jQuery));