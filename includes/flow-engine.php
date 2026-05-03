<?php
defined( 'ABSPATH' ) || exit;

/**
 * Returns conversation flow for the given template slug.
 * Custom overrides saved in DB are merged on top.
 */
function bigchat_get_flow( $tpl = 'generic' ) {

    $flows = array(

        'generic' => array(
            'start' => array(
                'msg'  => 'Hi there! How can I help you today?',
                'btns' => array(
                    array( 'label' => 'Ask a Question', 'next' => 'faq' ),
                    array( 'label' => 'Get in Touch',   'next' => 'lead' ),
                    array( 'label' => 'WhatsApp Us',    'next' => 'whatsapp' ),
                ),
            ),
            'faq' => array(
                'msg'  => 'Sure! What would you like to know?',
                'btns' => array(
                    array( 'label' => 'Working Hours', 'next' => 'hours' ),
                    array( 'label' => 'Location',      'next' => 'location' ),
                    array( 'label' => 'Pricing',       'next' => 'pricing' ),
                    array( 'label' => 'Back',          'next' => 'start' ),
                ),
            ),
            'hours'    => array( 'msg' => 'We are open Monday to Saturday, 9 AM to 6 PM.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
            'location' => array( 'msg' => 'Visit us at: [Your Address Here].', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
            'pricing'  => array(
                'msg'  => 'Our pricing varies by service. Want us to send you a custom quote?',
                'btns' => array(
                    array( 'label' => 'Yes, send a quote', 'next' => 'lead' ),
                    array( 'label' => 'Main Menu',         'next' => 'start' ),
                ),
            ),
            'lead'      => array( 'msg' => 'Please share your details and we will get back to you shortly.', 'action' => 'lead_form' ),
            'whatsapp'  => array( 'msg' => 'Click below to open WhatsApp and chat with us directly!', 'action' => 'whatsapp' ),
            'thank_you' => array( 'msg' => 'Thank you! We have received your details and will be in touch soon.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
        ),

        'agency' => array(
            'start' => array(
                'msg'  => 'Welcome! What brings you here today?',
                'btns' => array(
                    array( 'label' => 'Our Services',   'next' => 'services' ),
                    array( 'label' => 'View Portfolio', 'next' => 'portfolio' ),
                    array( 'label' => 'Get a Quote',    'next' => 'lead' ),
                    array( 'label' => 'WhatsApp Us',    'next' => 'whatsapp' ),
                ),
            ),
            'services' => array(
                'msg'  => 'We offer Web Design, SEO, Social Media Marketing, Paid Ads and Branding. Which interests you?',
                'btns' => array(
                    array( 'label' => 'Web Design',   'next' => 'lead' ),
                    array( 'label' => 'SEO',          'next' => 'lead' ),
                    array( 'label' => 'Social Media', 'next' => 'lead' ),
                    array( 'label' => 'Back',         'next' => 'start' ),
                ),
            ),
            'portfolio' => array(
                'msg'  => 'Check out our latest work at [your-portfolio-link]. Want to discuss a project?',
                'btns' => array(
                    array( 'label' => 'Yes, lets talk', 'next' => 'lead' ),
                    array( 'label' => 'Main Menu',      'next' => 'start' ),
                ),
            ),
            'lead'      => array( 'msg' => 'Awesome! Leave your details and our team will reach out within 24 hours.', 'action' => 'lead_form' ),
            'whatsapp'  => array( 'msg' => 'Chat with our team directly on WhatsApp!', 'action' => 'whatsapp' ),
            'thank_you' => array( 'msg' => 'Thank you! Our team will contact you shortly.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
        ),

        'clinic' => array(
            'start' => array(
                'msg'  => 'Welcome to our clinic. How can we assist you?',
                'btns' => array(
                    array( 'label' => 'Our Specialities',  'next' => 'specialities' ),
                    array( 'label' => 'Book Appointment',  'next' => 'lead' ),
                    array( 'label' => 'Clinic Hours',      'next' => 'hours' ),
                    array( 'label' => 'WhatsApp Us',       'next' => 'whatsapp' ),
                ),
            ),
            'specialities' => array(
                'msg'  => 'We specialise in General Medicine, Dermatology, Orthopaedics and Paediatrics. Book an appointment?',
                'btns' => array(
                    array( 'label' => 'Book Appointment', 'next' => 'lead' ),
                    array( 'label' => 'Main Menu',        'next' => 'start' ),
                ),
            ),
            'hours'     => array( 'msg' => 'Mon-Sat: 9 AM to 1 PM and 5 PM to 8 PM. Sundays by appointment only.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
            'lead'      => array( 'msg' => 'Please share your details to confirm your appointment.', 'action' => 'lead_form' ),
            'whatsapp'  => array( 'msg' => 'Chat with us on WhatsApp for quick assistance!', 'action' => 'whatsapp' ),
            'thank_you' => array( 'msg' => 'Appointment request received! We will confirm your slot shortly.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
        ),

        'restaurant' => array(
            'start' => array(
                'msg'  => 'Welcome! What can we do for you?',
                'btns' => array(
                    array( 'label' => 'View Menu',       'next' => 'menu' ),
                    array( 'label' => 'Reserve a Table', 'next' => 'lead' ),
                    array( 'label' => 'Hours and Location', 'next' => 'hours' ),
                    array( 'label' => 'WhatsApp Us',     'next' => 'whatsapp' ),
                ),
            ),
            'menu'      => array(
                'msg'  => 'View our full menu at [menu-link]. Ready to reserve a table?',
                'btns' => array(
                    array( 'label' => 'Reserve a Table', 'next' => 'lead' ),
                    array( 'label' => 'Main Menu',       'next' => 'start' ),
                ),
            ),
            'hours'     => array( 'msg' => 'Open daily 12 PM to 3 PM and 7 PM to 11 PM. Find us at [Address].', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
            'lead'      => array( 'msg' => 'Share your details and preferred date and time for reservation.', 'action' => 'lead_form' ),
            'whatsapp'  => array( 'msg' => 'Chat with us on WhatsApp to make a quick reservation!', 'action' => 'whatsapp' ),
            'thank_you' => array( 'msg' => 'Reservation request received! We will confirm shortly.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
        ),

        'realestate' => array(
            'start' => array(
                'msg'  => 'Welcome! Looking to buy, rent or sell a property?',
                'btns' => array(
                    array( 'label' => 'Buy Property',   'next' => 'buy' ),
                    array( 'label' => 'Rent Property',  'next' => 'rent' ),
                    array( 'label' => 'Sell Property',  'next' => 'lead' ),
                    array( 'label' => 'WhatsApp Agent', 'next' => 'whatsapp' ),
                ),
            ),
            'buy'  => array(
                'msg'  => 'Great! What type of property are you looking for?',
                'btns' => array(
                    array( 'label' => 'Apartment', 'next' => 'lead' ),
                    array( 'label' => 'Villa',     'next' => 'lead' ),
                    array( 'label' => 'Plot',      'next' => 'lead' ),
                ),
            ),
            'rent'      => array( 'msg' => 'Looking for rental properties? Share your requirements!', 'action' => 'lead_form' ),
            'lead'      => array( 'msg' => 'Leave your contact details and our agent will reach out with matching options!', 'action' => 'lead_form' ),
            'whatsapp'  => array( 'msg' => 'Connect with our property agent on WhatsApp!', 'action' => 'whatsapp' ),
            'thank_you' => array( 'msg' => 'Thank you! Our agent will contact you with matching properties.', 'btns' => array( array( 'label' => 'Main Menu', 'next' => 'start' ) ) ),
        ),
    );

    /* merge DB custom overrides */
    $custom = get_option( 'bigchat_custom_flow_' . sanitize_key( $tpl ), array() );
    if ( ! empty( $custom ) && isset( $flows[ $tpl ] ) ) {
        $flows[ $tpl ] = array_merge( $flows[ $tpl ], $custom );
    }

    return isset( $flows[ $tpl ] ) ? $flows[ $tpl ] : $flows['generic'];
}

/**
 * Returns the response data for a given step.
 */
function bigchat_process_step( $flow, $step ) {
    if ( ! isset( $flow[ $step ] ) ) {
        $step = 'start';
    }
    $node = $flow[ $step ];
    return array(
        'msg'    => isset( $node['msg'] )    ? $node['msg']    : '',
        'btns'   => isset( $node['btns'] )   ? $node['btns']   : array(),
        'action' => isset( $node['action'] ) ? $node['action'] : '',
        'step'   => $step,
    );
}
