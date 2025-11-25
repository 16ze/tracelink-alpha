import * as React from 'react';
import { Html, Button, Heading, Text, Container, Section, Link } from "@react-email/components";

export const WelcomeEmail = ({ firstName }: { firstName: string }) => (
  <Html lang="fr">
    <Section style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif', padding: '20px' }}>
      <Container style={{ margin: '0 auto', maxWidth: '600px', padding: '20px', border: '1px solid #eaeaea', borderRadius: '10px' }}>
        <Heading style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
          Bienvenue chez TraceLink ! 🚀
        </Heading>
        
        <Text style={{ fontSize: '16px', color: '#333', lineHeight: '24px' }}>
          Bonjour {firstName || 'cher utilisateur'},
        </Text>
        
        <Text style={{ fontSize: '16px', color: '#333', lineHeight: '24px' }}>
          Merci de votre inscription. Nous sommes ravis de vous compter parmi nous pour révolutionner la traçabilité textile.
        </Text>
        
        <Section style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <Heading as="h3" style={{ fontSize: '18px', margin: '0 0 10px 0' }}>
            Comment démarrer ?
          </Heading>
          <Text style={{ fontSize: '14px', margin: '5px 0' }}>1. Connectez-vous à votre Dashboard</Text>
          <Text style={{ fontSize: '14px', margin: '5px 0' }}>2. Créez votre marque</Text>
          <Text style={{ fontSize: '14px', margin: '5px 0' }}>3. Générez votre premier passeport produit</Text>
        </Section>

        <Section style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button
            href="https://tracelink.com/fr/login"
            style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Accéder à mon Dashboard
          </Button>
        </Section>
        
        <Text style={{ fontSize: '12px', color: '#666', textAlign: 'center', marginTop: '40px' }}>
          © {new Date().getFullYear()} TraceLink. Tous droits réservés.<br />
          Si vous avez des questions, répondez simplement à cet email.
        </Text>
      </Container>
    </Section>
  </Html>
);

export const ProWelcomeEmail = ({ firstName }: { firstName: string }) => (
  <Html lang="fr">
    <Section style={{ backgroundColor: '#ffffff', fontFamily: 'sans-serif', padding: '20px' }}>
      <Container style={{ margin: '0 auto', maxWidth: '600px', padding: '20px', border: '1px solid #eaeaea', borderRadius: '10px' }}>
        <Heading style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
          Félicitations ! Vous êtes passé Pro 🌟
        </Heading>
        
        <Text style={{ fontSize: '16px', color: '#333', lineHeight: '24px' }}>
          Bonjour {firstName || 'cher client'},
        </Text>
        
        <Text style={{ fontSize: '16px', color: '#333', lineHeight: '24px' }}>
          Merci pour votre achat. Votre compte a été mis à jour avec succès vers le plan Pro.
        </Text>
        
        <Section style={{ margin: '20px 0', padding: '20px', backgroundColor: '#f0fdf4', borderRadius: '5px', border: '1px solid #bbf7d0' }}>
          <Text style={{ fontSize: '16px', color: '#166534', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
            ✅ Produits illimités activés
          </Text>
        </Section>

        <Text style={{ fontSize: '16px', color: '#333', lineHeight: '24px' }}>
          Vous pouvez dès maintenant profiter de toutes les fonctionnalités avancées de TraceLink sans aucune limite.
        </Text>

        <Section style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button
            href="https://tracelink.com/fr/dashboard"
            style={{
              backgroundColor: '#000',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '16px'
            }}
          >
            Retourner au Dashboard
          </Button>
        </Section>
      </Container>
    </Section>
  </Html>
);

