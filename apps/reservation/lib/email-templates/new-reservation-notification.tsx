import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Link,
    Preview,
    Section,
    Text,
} from '@react-email/components';

interface NewReservationNotificationEmailProps {
    restaurantName: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string | null;
    reservationDate: string;
    reservationTime: string;
    partySize: number;
    serviceName: string;
    notes?: string | null;
    dashboardUrl: string;
    // Couleurs personnalisées
    primaryColor?: string;
    secondaryColor?: string;
}

export function NewReservationNotificationEmail({
    restaurantName,
    customerName,
    customerPhone,
    customerEmail,
    reservationDate,
    reservationTime,
    partySize,
    serviceName,
    notes,
    dashboardUrl,
    primaryColor = '#ff6b00',
    secondaryColor = '#0a0a0a',
}: NewReservationNotificationEmailProps) {
    // Styles dynamiques avec les couleurs du restaurant
    const dynamicHeader = {
        ...header,
        backgroundColor: primaryColor,
    };

    const dynamicIcon = {
        ...icon,
        color: primaryColor,
    };

    const dynamicCtaButton = {
        ...ctaButton,
        backgroundColor: primaryColor,
    };

    return (
        <Html>
            <Head />
            <Preview>Nouvelle reservation - {customerName} ({String(partySize)} pers.) - {reservationDate}</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={dynamicHeader}>
                        <Text style={headerBadge}>NOUVELLE RESERVATION</Text>
                        <Heading style={h1}>{partySize} personne{partySize > 1 ? 's' : ''}</Heading>
                        <Text style={headerSub}>{reservationDate} a {reservationTime}</Text>
                    </Section>

                    {/* Content */}
                    <Section style={content}>
                        {/* Client Info */}
                        <Section style={sectionBox}>
                            <Text style={sectionTitle}>CLIENT</Text>
                            <Text style={clientName}>{customerName}</Text>
                            <Text style={clientInfo}>
                                <span style={dynamicIcon}>Tel</span> {customerPhone}
                            </Text>
                            {customerEmail && (
                                <Text style={clientInfo}>
                                    <span style={dynamicIcon}>Email</span> {customerEmail}
                                </Text>
                            )}
                        </Section>

                        {/* Reservation Details */}
                        <Section style={sectionBox}>
                            <Text style={sectionTitle}>DETAILS</Text>
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
                                <span style={detailValue}>{partySize}</span>
                            </Text>
                        </Section>

                        {/* Notes */}
                        {notes && (
                            <Section style={notesBox}>
                                <Text style={sectionTitle}>NOTES DU CLIENT</Text>
                                <Text style={notesText}>{notes}</Text>
                            </Section>
                        )}

                        {/* CTA */}
                        <Section style={ctaSection}>
                            <Link href={dashboardUrl} style={dynamicCtaButton}>
                                Voir dans le dashboard
                            </Link>
                        </Section>
                    </Section>

                    <Hr style={hr} />

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Email envoye automatiquement par Orizons Reservation
                        </Text>
                        <Text style={footerText}>
                            {restaurantName}
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
}

// Styles
const main = {
    backgroundColor: '#1a1a1a',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    padding: '20px',
};

const container = {
    backgroundColor: '#0a0a0a',
    margin: '0 auto',
    padding: '0',
    maxWidth: '500px',
    borderRadius: '16px',
    overflow: 'hidden' as const,
    border: '1px solid #333',
};

const header = {
    backgroundColor: '#ff6b00',
    padding: '30px',
    textAlign: 'center' as const,
};

const headerBadge = {
    backgroundColor: 'rgba(0,0,0,0.2)',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '2px',
    padding: '6px 12px',
    borderRadius: '20px',
    display: 'inline-block' as const,
    margin: '0 0 15px 0',
};

const h1 = {
    color: '#000',
    fontSize: '42px',
    fontWeight: '800',
    margin: '0',
};

const headerSub = {
    color: 'rgba(0,0,0,0.7)',
    fontSize: '16px',
    fontWeight: '600',
    margin: '10px 0 0 0',
};

const content = {
    padding: '30px',
};

const sectionBox = {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
    border: '1px solid #222',
};

const sectionTitle = {
    color: '#666',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1.5px',
    margin: '0 0 12px 0',
    textTransform: 'uppercase' as const,
};

const clientName = {
    color: '#fff',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 10px 0',
};

const clientInfo = {
    color: '#aaa',
    fontSize: '14px',
    margin: '5px 0',
};

const icon = {
    color: '#ff6b00',
    fontWeight: '600' as const,
    marginRight: '8px',
};

const detailRow = {
    color: '#fff',
    fontSize: '14px',
    margin: '8px 0',
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
};

const detailLabel = {
    color: '#666',
};

const detailValue = {
    color: '#fff',
    fontWeight: '600' as const,
};

const notesBox = {
    backgroundColor: '#1a1500',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '15px',
    border: '1px solid #332800',
};

const notesText = {
    color: '#ffcc00',
    fontSize: '14px',
    margin: '0',
    lineHeight: '22px',
};

const ctaSection = {
    textAlign: 'center' as const,
    marginTop: '20px',
};

const ctaButton = {
    backgroundColor: '#ff6b00',
    color: '#000',
    fontSize: '14px',
    fontWeight: '700',
    textDecoration: 'none',
    padding: '14px 30px',
    borderRadius: '8px',
    display: 'inline-block' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '1px',
};

const hr = {
    borderColor: '#222',
    margin: '0',
};

const footer = {
    padding: '20px 30px',
    textAlign: 'center' as const,
};

const footerText = {
    color: '#555',
    fontSize: '12px',
    margin: '5px 0',
};

export default NewReservationNotificationEmail;
