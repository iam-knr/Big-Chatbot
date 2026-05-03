<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Returns the conversation flow array for a given template.
 * Each step: array( 'message' => '', 'buttons' => [], 'next' => '', 'action' => '' )
 * action: 'lead_form' | 'whatsapp' | 'end' | null
 */
function bigchat_get_flow( $template = 'generic' ) {
    $flows = array(

        'generic' => array(
            'start' => array(
                'message' => 'Hi there! 👋 How can I help you today?',
                'buttons' => array(
                    array( 'label' => '❓ Ask a Question', 'next' => 'faq' ),
                    array( 'label' => '📋 Get in Touch',   'next' => 'lead' ),
                    array( 'label' => '💬 WhatsApp Us',    'next' => 'whatsapp' ),
                ),
            ),
            'faq' => array(
                'message' => 'Sure! What would you like to know?',
                'buttons' => array(
                    array( 'label' => '🕐 Working Hours',  'next' => 'hours' ),
                    array( 'label' => '📍 Location',       'next' => 'location' ),
                    array( 'label' => '💰 Pricing',        'next' => 'pricing' ),
                    array( 'label' => '🔙 Back',           'next' => 'start' ),
                ),
            ),
            'hours'    => array( 'message' => 'We are open Monday–Saturday, 9 AM to 6 PM.', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
            'location' => array( 'message' => 'Visit us at: [Your Address Here]. 📍', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
            'pricing'  => array( 'message' => 'Our pricing varies by service. Would you like us to send you a quote?', 'buttons' => array(
                array( 'label' => '✅ Yes, send a quote', 'next' => 'lead' ),
                array( 'label' => '🏠 Main Menu',         'next' => 'start' ),
            ) ),
            'lead'      => array( 'message' => 'Great! Please share your details and we will get back to you.', 'action' => 'lead_form', 'buttons' => array() ),
            'whatsapp'  => array( 'message' => 'Click below to open WhatsApp and chat directly with us!', 'action' => 'whatsapp', 'buttons' => array() ),
            'thank_you' => array( 'message' => 'Thank you! 🎉 We have received your details and will be in touch soon.', 'action' => 'end', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
        ),

        'agency' => array(
            'start' => array(
                'message' => 'Welcome! 🚀 What brings you here today?',
                'buttons' => array(
                    array( 'label' => '🎨 Our Services',    'next' => 'services' ),
                    array( 'label' => '💼 View Portfolio',  'next' => 'portfolio' ),
                    array( 'label' => '💰 Get a Quote',     'next' => 'lead' ),
                    array( 'label' => '💬 WhatsApp Us',     'next' => 'whatsapp' ),
                ),
            ),
            'services'  => array( 'message' => 'We offer Web Design, SEO, Social Media Marketing, Paid Ads and Branding. Which interests you?', 'buttons' => array(
                array( 'label' => '🌐 Web Design', 'next' => 'lead' ),
                array( 'label' => '📈 SEO',         'next' => 'lead' ),
                array( 'label' => '📣 Social Media','next' => 'lead' ),
                array( 'label' => '🔙 Back',        'next' => 'start' ),
            ) ),
            'portfolio' => array( 'message' => 'Check out our latest work at [your-portfolio-link]. Want to discuss a project?', 'buttons' => array(
                array( 'label' => '✅ Yes, let's talk', 'next' => 'lead' ),
                array( 'label' => '🏠 Main Menu',       'next' => 'start' ),
            ) ),
            'lead'      => array( 'message' => 'Awesome! Leave your details and our team will reach out within 24 hours.', 'action' => 'lead_form', 'buttons' => array() ),
            'whatsapp'  => array( 'message' => 'Chat with our team directly on WhatsApp!', 'action' => 'whatsapp', 'buttons' => array() ),
            'thank_you' => array( 'message' => 'Thank you! 🎉 Our team will contact you shortly.', 'action' => 'end', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
        ),

        'clinic' => array(
            'start' => array(
                'message' => 'Hello! 👨‍⚕️ Welcome to our clinic. How can we assist you?',
                'buttons' => array(
                    array( 'label' => '🏥 Our Specialities',    'next' => 'specialities' ),
                    array( 'label' => '📅 Book Appointment',    'next' => 'lead' ),
                    array( 'label' => '🕐 Clinic Hours',        'next' => 'hours' ),
                    array( 'label' => '💬 WhatsApp Us',         'next' => 'whatsapp' ),
                ),
            ),
            'specialities' => array( 'message' => 'We specialise in General Medicine, Dermatology, Orthopaedics and Paediatrics. Would you like to book an appointment?', 'buttons' => array(
                array( 'label' => '📅 Book Appointment', 'next' => 'lead' ),
                array( 'label' => '🏠 Main Menu',        'next' => 'start' ),
            ) ),
            'hours'     => array( 'message' => 'We are open Mon–Sat: 9 AM–1 PM and 5 PM–8 PM. Sundays by appointment only.', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
            'lead'      => array( 'message' => 'Please share your details to confirm your appointment.', 'action' => 'lead_form', 'buttons' => array() ),
            'whatsapp'  => array( 'message' => 'Chat with us on WhatsApp for quick assistance!', 'action' => 'whatsapp', 'buttons' => array() ),
            'thank_you' => array( 'message' => 'Appointment request received! 🎉 We will confirm your slot shortly.', 'action' => 'end', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
        ),

        'restaurant' => array(
            'start' => array(
                'message' => 'Welcome! 🍽️ What can we do for you?',
                'buttons' => array(
                    array( 'label' => '📖 View Menu',       'next' => 'menu' ),
                    array( 'label' => '🪑 Reserve a Table', 'next' => 'lead' ),
                    array( 'label' => '🕐 Hours & Location','next' => 'hours' ),
                    array( 'label' => '💬 WhatsApp Us',     'next' => 'whatsapp' ),
                ),
            ),
            'menu'      => array( 'message' => 'View our full menu at [menu-link]. Ready to reserve a table?', 'buttons' => array(
                array( 'label' => '🪑 Reserve a Table', 'next' => 'lead' ),
                array( 'label' => '🏠 Main Menu',       'next' => 'start' ),
            ) ),
            'hours'     => array( 'message' => 'We are open daily 12 PM–3 PM and 7 PM–11 PM. Find us at [Address].', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
            'lead'      => array( 'message' => 'Share your details and preferred date/time for reservation.', 'action' => 'lead_form', 'buttons' => array() ),
            'whatsapp'  => array( 'message' => 'Chat with us on WhatsApp to make a quick reservation!', 'action' => 'whatsapp', 'buttons' => array() ),
            'thank_you' => array( 'message' => 'Reservation request received! 🎉 We will confirm shortly.', 'action' => 'end', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
        ),

        'realestate' => array(
            'start' => array(
                'message' => 'Welcome! 🏡 Looking to buy, rent or sell a property?',
                'buttons' => array(
                    array( 'label' => '🏠 Buy Property',    'next' => 'buy' ),
                    array( 'label' => '🔑 Rent Property',   'next' => 'rent' ),
                    array( 'label' => '📣 Sell Property',   'next' => 'lead' ),
                    array( 'label' => '💬 WhatsApp Agent',  'next' => 'whatsapp' ),
                ),
            ),
            'buy'       => array( 'message' => 'Great! What type of property are you looking for?', 'buttons' => array(
                array( 'label' => '🏢 Apartment', 'next' => 'lead' ),
                array( 'label' => '🏘️ Villa',     'next' => 'lead' ),
                array( 'label' => '🏗️ Plot',      'next' => 'lead' ),
            ) ),
            'rent'      => array( 'message' => 'Looking for rental properties? Share your requirements!', 'action' => 'lead_form', 'buttons' => array() ),
            'lead'      => array( 'message' => 'Leave your contact details and our agent will reach out with options!', 'action' => 'lead_form', 'buttons' => array() ),
            'whatsapp'  => array( 'message' => 'Connect with our property agent on WhatsApp!', 'action' => 'whatsapp', 'buttons' => array() ),
            'thank_you' => array( 'message' => 'Thank you! 🎉 Our agent will contact you with matching properties.', 'action' => 'end', 'buttons' => array( array( 'label' => '🏠 Main Menu', 'next' => 'start' ) ) ),
        ),
    );

    // Merge with any custom flow saved in DB
    $custom = get_option( 'bigchat_custom_flow_' . $template, array() );
    if ( ! empty( $custom ) ) {
        $flows[ $template ] = array_merge( $flows[ $template ] ?? array(), $custom );
    }

    return isset( $flows[ $template ] ) ? $flows[ $template ] : $flows['generic'];
}

/**
 * Process a step from the flow and return the response data.
 */
function bigchat_process_step( $flow, $step, $message = '' ) {
    $current = isset( $flow[ $step ] ) ? $flow[ $step ] : $flow['start'];
    return array(
        'message' => $current['message'],
        'buttons' => $current['buttons'] ?? array(),
        'action'  => $current['action']  ?? null,
        'step'    => $step,
    );
}
