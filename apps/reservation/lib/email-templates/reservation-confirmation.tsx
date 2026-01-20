import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface ReservationConfirmationEmailProps {
    customerName: string;
    restaurantName: string;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    serviceName: string;
    confirmationMessage?: string | null;
    restaurantPhone?: string | null;
    restaurantEmail?: string | null;
    restaurantAddress?: string | null;
    // Couleurs personnalisées
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
}

export function ReservationConfirmationEmail({
    customerName,
    restaurantName,
    reservationDate,
    reservationTime,
    partySize,
    serviceName,
    confirmationMessage,
    restaurantPhone,
    restaurantEmail,
    restaurantAddress,
    primaryColor = '#ff6b00',
    secondaryColor = '#0a0a0a',
    accentColor = '#ffffff',
}: ReservationConfirmationEmailProps) {
    // Styles dynamiques avec les couleurs du restaurant
    const dynamicHeader = {
        ...header,
        backgroundColor: primaryColor,
    };

    const dynamicMessageBox = {
        ...messageBox,
        borderLeftColor: primaryColor,
    };

    const dynamicH2 = {
        ...h2,
        color: primaryColor,
    };

    return (
        <Html>
            <Head />
            <Preview>Confirmation de votre reservation chez {restaurantName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={dynamicHeader}>
                        <Heading style={h1}>{restaurantName}</Heading>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        <Heading as="h2" style={dynamicH2}>
                            Reservation confirmee !
                        </Heading>

                        <Text style={text}>
                            Bonjour {customerName},
                        </Text>

                        <Text style={text}>
                            Nous avons bien recu votre demande de reservation. Voici les details :
                        </Text>

                        {/* Reservation Details */}
                        <Section style={detailsBox}>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Date</span>
                                <span style={detailValue}>{reservationDate}</span>
                            </Text>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Heure</span>
                                <span style={detailValue}>{reservationTime}</span>
                            </Text>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Service</span>
                                <span style={detailValue}>{serviceName}</span>
                            </Text>
                            <Text style={detailRow}>
                                <span style={detailLabel}>Couverts</span>
                                <span style={detailValue}>{partySize} personne{partySize > 1 ? 's' : ''}</span>
                            </Text>
                        </Section>

                        {confirmationMessage && (
                            <Text style={dynamicMessageBox}>
                                {confirmationMessage}
                            </Text>
                        )}

                        <Text style={text}>
                            Nous avons hate de vous accueillir !
                        </Text>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            <strong>{restaurantName}</strong>
                        </Text>
                        {restaurantAddress && (
                            <Text style={footerText}>{restaurantAddress}</Text>
                        )}
                        {restaurantPhone && (
                            <Text style={footerText}>Tel : {restaurantPhone}</Text>
                        )}
                        {restaurantEmail && (
                            <Text style={footerText}>Email : {restaurantEmail}</Text>
                        )}
                        <Text style={footerNote}>
                            Pour modifier ou annuler votre reservation, contactez-nous directement.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#f6f6f6',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    maxWidth: '600px',
    borderRadius: '8px',
    overflow: 'hidden' as const,
};

const header = {
    backgroundColor: '#ff6b00',
    padding: '30px 40px',
    textAlign: 'center' as const,
};

const h1 = {
    color: '#ffffff',
    fontSize: '28px',
    fontWeight: '700',
    margin: '0',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
};

const content = {
    padding: '40px',
};

const h2 = {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '600',
    margin: '0 0 20px 0',
};

const text = {
    color: '#4a4a4a',
    fontSize: '16px',
    lineHeight: '26px',
    margin: '0 0 15px 0',
};

const detailsBox = {
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    border: '1px solid #eee',
};

const detailRow = {
    color: '#1a1a1a',
    fontSize: '15px',
    margin: '8px 0',
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
};

const detailLabel = {
    color: '#888',
    fontWeight: '500' as const,
};

const detailValue = {
    color: '#1a1a1a',
    fontWeight: '600' as const,
};

const messageBox = {
    backgroundColor: '#fff8f0',
    borderLeft: '4px solid #ff6b00',
    padding: '15px 20px',
    margin: '20px 0',
    color: '#4a4a4a',
    fontSize: '15px',
    fontStyle: 'italic' as const,
};

const hr = {
    borderColor: '#eee',
    margin: '0',
};

const footer = {
    padding: '30px 40px',
    backgroundColor: '#fafafa',
};

const footerText = {
    color: '#666',
    fontSize: '14px',
    margin: '0 0 5px 0',
    textAlign: 'center' as const,
};

const footerNote = {
    color: '#999',
    fontSize: '12px',
    margin: '15px 0 0 0',
    textAlign: 'center' as const,
};

export default ReservationConfirmationEmail;
