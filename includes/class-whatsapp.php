<?php
if ( ! defined( 'ABSPATH' ) ) exit;

class BigChatbot_Whatsapp {

    /**
     * Returns a wa.me deeplink URL.
     * @param string $phone  International format, digits only e.g. 919876543210
     * @param string $text   Pre-filled message text (optional)
     */
    public static function get_link( $phone, $text = '' ) {
        $phone = preg_replace( '/[^0-9]/', '', $phone );
        $url   = 'https://wa.me/' . $phone;
        if ( $text ) {
            $url .= '?text=' . rawurlencode( $text );
        }
        return esc_url( $url );
    }
}
