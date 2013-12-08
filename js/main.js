// Checks validitity of date string
function isValidDate(value) {
  var userFormat = 'mm/dd/yyyy';

  if(typeof value === 'undefined'){
	return false;
  }
  
  delimiter = /[^mdy]/.exec(userFormat)[0],
  theFormat = userFormat.split(delimiter),
  theDate = value.split(delimiter),

  isDate = function (date, format) {
    var m, d, y
    for (var i = 0, len = format.length; i < len; i++) {
      if (/m/.test(format[i])) m = date[i]
      if (/d/.test(format[i])) d = date[i]
      if (/y/.test(format[i])) y = date[i]
    }
    return (
      m > 0 && m < 13 &&
      y && y.length === 4 &&
      d > 0 && d <= (new Date(y, m, 0)).getDate()
    )
  }

  return isDate(theDate, theFormat)
}

// Simple check range function
function between(x, min, max) {
  return x >= min && x <= max;
}

// Manage Doctor Object
(function ($){
	window.ManageDoctor = function(options) {
		// All of the ManageDoctor functions
		var initialize = null,
			initEvents = null,
			initDom = null
			validateEmail = null,
			updateDoctorField = null,
			loadDoctor = null,
			createDoctor = null,
			createBookingRequest = null,
			loadBookingRequests = null,
			attachBookingRequestEvents = null,
			cancelBookingRequest = null,
			checkRequestsLeft = null,
			setNextAvailableDateTime = null,
			getRescheduleTimes = null,
			refreshRequests = null,
			doesTimeConflictWithAppointments = null,
			loadManagementScreen  = null;
	
		// Config is used for configurations
		this.config = null;
		// Doctor's email
		this.email = null;
		// Doctor's profile info
		this.doctor = null;
		// All of the booking requests at time of sign in
		this.bookingRequests = Array();
		// All of the doctor's current appointments
		this.appointments = Array();
		
		// Main initializer
		initialize = $.proxy(function(){
			this.config = $.extend(true, ManageDoctor.defaultConfig, options);
			initDom();
			initEvents();
		}, this);
		
		// Main initializer
		initDom = $.proxy(function(){
			var tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate()+1);
			
			// Initializes the reschedule date picker and time picker
			$(this.config.elements.bookings.rescheduleDate).datepicker({
				minDate: tomorrow
			});
			$(this.config.elements.bookings.rescheduleTime).select2({
				placeholder: "Select an appointment date to get times"
			});
		}, this);
		
		// Initializes load time events
		initEvents = $.proxy(function(){
		
			$(this.config.elements.bookings.rescheduleNextAvailable).on('click', $.proxy(function(e){
				var time = $(e.currentTarget).attr('data-id'),
					$container = $(this.config.elements.bookings.rescheduleContainer),
					bookingID = $container.attr('data-id'),
					$date = $(this.config.elements.bookings.rescheduleDate),
					$time = $(this.config.elements.bookings.rescheduleTime);
				
				acceptBookingRequest(bookingID,parseInt(time));
				$time.empty();
				$date.val('');
				$container.removeClass('active');
			}, this));
		
			// When the rescheduler changes dates, the available times change
			$(this.config.elements.bookings.rescheduleDate).on('change', $.proxy(function(){
				var date = $(this.config.elements.bookings.rescheduleDate).val(),
					dateValid = isValidDate(date),
					$times = $(this.config.elements.bookings.rescheduleTime),
					times = null;
				
				if(dateValid){
					times = getRescheduleTimes(moment(date), false);
					$times.select2('destroy');
					
					$.each(times, $.proxy(function(idx, val){
						$times.append('<option value='+val.id+'>'+val.text+'</option>')
					}, this));
					
					$times.select2({
						placeholder: "Select a time"
					});
				}
			}, this));
			
			// Closes the rescheduler picker
			$(this.config.elements.bookings.rescheduleClose).on('click', $.proxy(function(){
				var $container = $(this.config.elements.bookings.rescheduleContainer),
					$date = $(this.config.elements.bookings.rescheduleDate),
					$time =  $(this.config.elements.bookings.rescheduleTime);
					
					$container.removeClass('active');
					$time.empty();
					$date.val('');
			}, this));
			
			// Reschedule picker event
			$(this.config.elements.bookings.reschedule).on('click.submit', $.proxy(function(){
				var $date = $(this.config.elements.bookings.rescheduleDate),
					$time = $(this.config.elements.bookings.rescheduleTime),
					$container = $(this.config.elements.bookings.rescheduleContainer),
					militaryTimeRe = /(00|01|02|03|04|05|06|07|08|09|10|11|12|13|14|15|16|17|18|19|20|21|22|23)[:](0|1|2|3|4|5)\d{1}/,
					date = $date.val(),
					time = $time.select2('val'),
					dateValid = isValidDate(date),
					timeValid = time != "";
					parsedDate = null,
					today = null,
					dateDiff = null;
				
				// Make sure inputs are valid, inform user if not
				if(!dateValid){
					$date.addClass('invalid');
				} else {
					// Make sure date is after today
					parsedDate = moment(date, 'MM-DD-YYYY'),
					today = moment(),
					dateDiff = parsedDate.diff(today, 'days');
					
					if(dateDiff >= 0){
						$date.removeClass('invalid');
					} else {
						dateValid = false;
						$date.addClass('invalid');
					}
					
					
				}
				
				if(!timeValid){
					$time.addClass('invalid');
				} else {
					$time.removeClass('invalid');
				}
				
				if(dateValid && timeValid){
					acceptBookingRequest($container.attr('data-id'), parseInt(time));
					$time.empty();
					$date.val('');
					$container.removeClass('active');
					
				}
				
			}, this));
		
			// Logout scenario
			$('.logout').on('click', $.proxy(function(e){
				location.reload();
				createBookingRequest();
			}, this));
			
			// Close navbar drop down for mobile on click
			$('.nav a').on('click', function(){
				if($(this).closest('.in').length){
					$("button.navbar-toggle").click();
				}
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
				
				// Email must exist and be valid
				if(email.length > 0 && validateEmail(email)){
					
					// Easy way to avoid double submissions
					if($el.hasClass('submitting')){
						return;
					} else {
						$el.addClass('submitting');
					}
					
					$email.removeClass('invalid');
					$(this.config.elements.login.loading).show();
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
				time = moment();
			
			// This scenario is run to have a conflicting scheduled booking
			time.add('days', 14);
			$newRequest.set({
				patientFirstName: 'Chris',
				patientLastName: 'Gosselin', 
				requestTime: time.valueOf(), 
				description: 'Check up', 
				doctor: 'greg@gmail.com',
				patientAvatar: 'http://m.c.lnkd.licdn.com/mpr/pub/image-vQXp4Zy0CpmigY8dPFox9R6J3tQJC1Lbk9_VK0O43WL0ClYWvQXVMph03gwkN98onKvj/chris-gosselin.jpg'
			});
			time.add('days', 14);
			
			$newRequest = $bookingRef.push(),
			$newRequest.set({
				patientFirstName: 'Ryan',
				patientLastName: 'Lewis', 
				requestTime: time.valueOf(), 
				description: 'Hands hurt', 
				doctor: 'greg@gmail.com',
				patientAvatar: 'http://www.xxlmag.com/wp-content/uploads/2013/03/Ryan-Lewis001.jpg'
			});
			time.add('days', 14);
			
			$newRequest = $bookingRef.push();
			$newRequest.set({
				patientFirstName: 'George',
				patientLastName: 'Washington', 
				requestTime: time.valueOf(), 
				description: 'Teeth Missing', 
				doctor: 'greg@gmail.com',
				patientAvatar: 'http://www.usmilitaryhalloffame.org/portals/0/Washington/george_washington_1307582258.jpg'
			});
			time.add('days', 14);
			
			$newRequest = $bookingRef.push();
			$newRequest.set({
				patientFirstName: 'Kendrick',
				patientLastName: 'Lamar', 
				requestTime: time.valueOf(), 
				description: 'Vocal chords', 
				doctor: 'greg@gmail.com',
				patientAvatar: 'https://lh4.googleusercontent.com/-Vduw_xqikZY/AAAAAAAAAAI/AAAAAAAAADA/dSD6BQ_C-T4/s120-c/photo.jpg'
			});
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
									this.appointments.push(appointment);
									// Check if any bookings conflict with the appointment time, if so set flag
									$.each(this.bookingRequests, $.proxy(function(bookingIndex, booking){
										var appointmentStart = appointment.requestTime,
											appointmentEnd = moment(appointment.requestTime).add('minute', this.config.appointmentTimeMin).valueOf(),
											bookingStart = booking.requestTime,
											bookingEnd = moment(booking.requestTime).add('minute', this.config.appointmentTimeMin).valueOf();
											
										if(between(bookingStart, appointmentStart, appointmentEnd) ||
										between(bookingEnd, appointmentStart, appointmentEnd)){
											this.bookingRequests[bookingIndex].conflict = true;
										}
									}, this));
								}
							},this));
						}
						
						// Create the request object for each booking
						$bookingTemplate.removeClass('template');
						this.bookingRequests.sort(function compare(a,b) {
							if (a.requestTime < b.requestTime)
								return -1;
							if (a.requestTime > b.requestTime)
								return 1;
							return 0;
						});
						
						$.each(this.bookingRequests, $.proxy(function(idx, val){
							var $request = $bookingTemplate.clone(),
								date = moment(val.requestTime);
							
							if(typeof val.conflict !== 'undefined' && val.conflict){
								$request.addClass('conflict');
							}
							
							$request.attr('data-id', val.id)
							$request.find('.patient-first-name').text(val.patientFirstName);
							$request.find('.patient-last-name').text(val.patientLastName);
							$request.find('.patient-avatar').attr('src', val.patientAvatar);
							$request.find('.patient-appointment-date').text(date.format("MMM Do YYYY"));
							$request.find('.patient-appointment-time').text(date.format("h:mm a") + " - " + date.add('m', this.config.appointmentTimeMin).format("h:mm a"));
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
				var $container = $(e.currentTarget).closest(this.config.elements.bookings.request),
					$date = $(this.config.elements.bookings.rescheduleDate),
					$time = $(this.config.elements.bookings.rescheduleTime);
					
				acceptBookingRequest($container.attr('data-id'));
				$time.empty();
				$date.val('');
				$container.removeClass('active');
			}, this));
			
			$(this.config.elements.bookings.rescheduleBooking).on('click', $.proxy(function(e){
				var $request = $(e.currentTarget).closest(this.config.elements.bookings.request),
					$times = $(this.config.elements.bookings.rescheduleTime),
					$reschedule = $(this.config.elements.bookings.rescheduleContainer);	
					
				setNextAvailableDateTime();
				
				$times.select2('destroy');
				$times.empty();
				$times.append('<option></option>');
				$times.select2({
					placeholder: "Select an appointment date to get times"
				});
				
				$reschedule.attr('data-id', $request.attr('data-id'));
				$(this.config.elements.bookings.rescheduleContainer).addClass('active');
			}, this));
			
			$(this.config.elements.bookings.cancelBooking).on('click', $.proxy(function(e){
				var $container = $(e.currentTarget).closest(this.config.elements.bookings.request);				
				cancelBookingRequest($container.attr('data-id'));
			}, this));
		}, this);
		
		// Accepts a booking request
		acceptBookingRequest = $.proxy(function(bookingID, newTime){
			// Grab the node data, attach it to the doctor's appointments, remove the node
			var $bookingRef = new Firebase(this.config.firebase.bookingRequests+'/'+bookingID);
			
			$bookingRef.on('value', $.proxy(function(snapshot){
				var data = snapshot.val(),
					$appointmentsRef = new Firebase(this.config.firebase.appointments),
					$newAppointment = $appointmentsRef.push(),
					checkDate = null;
					
				if(data !== null){
					if(typeof newTime !== 'undefined'){
						data.requestTime = newTime;
					}
					
					checkDate = moment(data.requestTime);
					$newAppointment.set(data);
				}
				
				$bookingRef.off('value');
				$bookingRef.set(null);
				
				this.appointments.push(data);
				refreshRequests();
				
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

		// Gets and sets the next available rescheduling time
		setNextAvailableDateTime = $.proxy(function(){
			var tomorrow = moment().add('day', 1),
				rescheduleTimes = getRescheduleTimes(tomorrow, true),
				$nextAvailable = $(this.config.elements.bookings.rescheduleNextAvailable);
			
			while(!rescheduleTimes.length){
				tomorrow.add('day', 1);
				rescheduleTimes = getRescheduleTimes(tomorrow, true);
			}
			
			$nextAvailable.attr('data-id', rescheduleTimes[0].id);
			$nextAvailable.text(rescheduleTimes[0].text);
			
		}, this);
		
		// Gets the available times for a given day
		getRescheduleTimes = $.proxy(function(day, includeDate){
			var availableTimes = Array();
				
			day.set('hour', this.config.startHour);
			day.set('minute', 0);
			day.set('second', 0);
			day.set('millisecond', 0);

			while(day.hour() < this.config.endHour){
				if(!doesTimeConflictWithAppointments(day.valueOf())){
					if(includeDate){
						availableTimes.push({id: day.valueOf(), text: day.format('MMM Do YYYY, h:mm a')});
					} else {
						availableTimes.push({id: day.valueOf(), text: day.format('h:mm a')});
					}
					
				}
				day.set('hour', day.hour()+1);
			}
			
			return availableTimes;
			
		}, this);
		
		// Checks all the bookings and sees if there are any conflicts
		refreshRequests = $.proxy(function(){
			$.each(this.bookingRequests, $.proxy(function(bookingIndex, booking){
				if(doesTimeConflictWithAppointments(booking.requestTime)){
					this.bookingRequests[bookingIndex].conflict = true;
					$(this.config.elements.bookings.request+'[data-id="'+booking.id+'"]').addClass('conflict');
				}
			}, this));
		}, this);
		
		// Checks to see if a given timestamp will conflict with the doctor's appointments
		doesTimeConflictWithAppointments = $.proxy(function(timestamp){
			var conflict = false;
			// For reach appointment
			$.each(this.appointments, $.proxy(function(idx, val){
				var appointmentStart = val.requestTime,
					appointmentEnd = moment(val.requestTime).add('minute', this.config.appointmentTimeMin).valueOf(),
					bookingStart = timestamp,
					bookingEnd = moment(timestamp).add('minute', this.config.appointmentTimeMin).valueOf();
				
				if(between(bookingStart, appointmentStart, appointmentEnd) ||
				between(bookingEnd, appointmentStart, appointmentEnd)){
					conflict = true;
				}
			},this));
			
			return conflict;
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
					submit : '#login-page .info .submit-data',
					loading : '#login-page .loading-container'
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
					noMore:  '#manage-doctor-assets #bookings .request-container .no-more-requests',
					reschedule: '#manage-doctor-assets #bookings .reschedule-info .submit-data',
					rescheduleNextAvailable: '#manage-doctor-assets #bookings .reschedule-info .next-available',
					rescheduleDate: '#manage-doctor-assets #bookings .reschedule-info #reschedule-date',
					rescheduleTime: '#manage-doctor-assets #bookings .reschedule-info #reschedule-time',
					rescheduleContainer: '#manage-doctor-assets #bookings .fixed-center-container',
					rescheduleClose: '#manage-doctor-assets #bookings .fixed-center-container .close'
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
			appointmentTimeMin : 60,
			appointmentTimeMili: 360000,
			startHour: 9,
			endHour: 18
		};
		
		// Start building the object
		initialize();
	}
}(window.jQuery));