import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Lead = {
  id: string;
  courseName: string;
  contactName: string;
  email: string;
  city: string;
  holes: 9 | 18 | 27 | 36;
  currentStack: string;
  stage: 'New' | 'Contacted' | 'Demo Scheduled' | 'Proposal Sent' | 'Closed Won';
  intentScore: number;
};

type Campaign = {
  targetProblem: string;
  differentiator: string;
  offer: string;
  cta: string;
};

type Channels = {
  yourEmail: string;
  websiteUrl: string;
  linkedinUrl: string;
  instagramUrl: string;
  facebookUrl: string;
};

const STORAGE_KEY = 'tee-tours-growth-hq-v1';

const starterLeads: Lead[] = [
  {
    id: 'l-001',
    courseName: 'Pine Ridge Golf Club',
    contactName: 'Morgan Smith',
    email: 'morgan@pineridgegc.com',
    city: 'Orlando, FL',
    holes: 18,
    currentStack: 'Legacy tee sheet + spreadsheets',
    stage: 'Contacted',
    intentScore: 74,
  },
  {
    id: 'l-002',
    courseName: 'Rolling Oaks Country Club',
    contactName: 'Jamie Carter',
    email: 'jamie@rollingoakscc.com',
    city: 'Scottsdale, AZ',
    holes: 27,
    currentStack: 'Manual POS sync and old booking tool',
    stage: 'Demo Scheduled',
    intentScore: 88,
  },
  {
    id: 'l-003',
    courseName: 'Bluewater Municipal Golf',
    contactName: 'Avery Johnson',
    email: 'avery@bluewatergolf.gov',
    city: 'Tampa, FL',
    holes: 18,
    currentStack: 'Municipal scheduling portal',
    stage: 'New',
    intentScore: 61,
  },
];

const starterCampaign: Campaign = {
  targetProblem: 'Lost revenue from no-shows and hard-to-fill tee time windows',
  differentiator: 'Tee Tours combines automated tee-time optimization and course ops analytics in one dashboard',
  offer: 'Free 21-day pilot with live onboarding for your staff',
  cta: 'Reply "PILOT" and I will send available kickoff times',
};

const starterChannels: Channels = {
  yourEmail: 'hello@teetours.com',
  websiteUrl: 'https://teetours.com',
  linkedinUrl: 'https://www.linkedin.com/company/teetours',
  instagramUrl: 'https://www.instagram.com/teetours',
  facebookUrl: 'https://www.facebook.com/teetours',
};

const stageColor: Record<Lead['stage'], string> = {
  New: '#94A3B8',
  Contacted: '#3B82F6',
  'Demo Scheduled': '#8B5CF6',
  'Proposal Sent': '#F59E0B',
  'Closed Won': '#10B981',
};

const weekPlan = [
  'Monday: Send 15 personalized outreach emails to high-intent private clubs.',
  'Tuesday: Post ROI case study carousel on LinkedIn and Instagram.',
  'Wednesday: Publish website landing page update focused on no-show recovery.',
  'Thursday: Run 6 discovery calls and qualify operational pains.',
  'Friday: Ship follow-up proposal videos and request pilot approvals.',
];

function parseCampaign(lead: Lead, campaign: Campaign) {
  const subject = `${lead.courseName}: recover lost tee time revenue in 30 days`;
  const body = [
    `Hi ${lead.contactName},`,
    '',
    `I work with golf operators that are dealing with ${campaign.targetProblem.toLowerCase()}.`,
    `Because ${lead.courseName} is currently running ${lead.currentStack.toLowerCase()}, there is a fast path to results.`,
    '',
    campaign.differentiator,
    '',
    `Offer for ${lead.courseName}: ${campaign.offer}.`,
    campaign.cta,
    '',
    '— Tee Tours',
  ].join('\n');

  return { subject, body };
}

export default function App() {
  const [leads, setLeads] = useState<Lead[]>(starterLeads);
  const [campaign, setCampaign] = useState<Campaign>(starterCampaign);
  const [channels, setChannels] = useState<Channels>(starterChannels);
  const [activeLeadId, setActiveLeadId] = useState<string>(starterLeads[0].id);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as {
          leads: Lead[];
          campaign: Campaign;
          channels: Channels;
          activeLeadId: string;
        };

        setLeads(parsed.leads ?? starterLeads);
        setCampaign(parsed.campaign ?? starterCampaign);
        setChannels(parsed.channels ?? starterChannels);
        setActiveLeadId(parsed.activeLeadId ?? starterLeads[0].id);
      } catch {
        Alert.alert('Using starter data', 'We could not load saved data.');
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const payload = JSON.stringify({ leads, campaign, channels, activeLeadId });
    void AsyncStorage.setItem(STORAGE_KEY, payload);
  }, [leads, campaign, channels, activeLeadId]);

  const activeLead = useMemo(
    () => leads.find((lead) => lead.id === activeLeadId) ?? leads[0],
    [activeLeadId, leads],
  );

  const generated = useMemo(() => parseCampaign(activeLead, campaign), [activeLead, campaign]);

  const weightedPipeline = useMemo(
    () => leads.reduce((sum, lead) => sum + lead.intentScore * (lead.holes / 18), 0),
    [leads],
  );

  const highIntent = leads.filter((lead) => lead.intentScore >= 80).length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <Text style={styles.title}>Tee Tours Growth HQ</Text>
      <Text style={styles.subtitle}>
        Free, focused multi-channel marketing workspace for golf course management software outreach.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Revenue Pipeline Snapshot</Text>
        <View style={styles.metricRow}>
          <Metric label="Leads" value={String(leads.length)} />
          <Metric label="High Intent" value={String(highIntent)} />
          <Metric label="Weighted Score" value={String(Math.round(weightedPipeline))} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lead Command Center</Text>
        <Text style={styles.helper}>Tap a lead to generate personalized outreach instantly.</Text>
        {leads.map((lead) => {
          const active = lead.id === activeLead.id;

          return (
            <Pressable
              key={lead.id}
              onPress={() => setActiveLeadId(lead.id)}
              style={[styles.leadItem, active && styles.activeLeadItem]}
            >
              <View>
                <Text style={styles.leadName}>{lead.courseName}</Text>
                <Text style={styles.leadMeta}>{lead.contactName} • {lead.city}</Text>
              </View>
              <View style={styles.badgeWrap}>
                <Text style={[styles.stageBadge, { backgroundColor: stageColor[lead.stage] }]}>{lead.stage}</Text>
                <Text style={styles.score}>{lead.intentScore}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Campaign Builder</Text>
        <Field
          label="Target problem"
          value={campaign.targetProblem}
          onChangeText={(targetProblem) => setCampaign((prev) => ({ ...prev, targetProblem }))}
        />
        <Field
          label="Differentiator"
          value={campaign.differentiator}
          onChangeText={(differentiator) => setCampaign((prev) => ({ ...prev, differentiator }))}
        />
        <Field
          label="Offer"
          value={campaign.offer}
          onChangeText={(offer) => setCampaign((prev) => ({ ...prev, offer }))}
        />
        <Field
          label="CTA"
          value={campaign.cta}
          onChangeText={(cta) => setCampaign((prev) => ({ ...prev, cta }))}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Personalized Email Draft</Text>
        <Text style={styles.previewLabel}>To</Text>
        <Text style={styles.previewValue}>{activeLead.email}</Text>
        <Text style={styles.previewLabel}>Subject</Text>
        <Text style={styles.previewValue}>{generated.subject}</Text>
        <Text style={styles.previewLabel}>Body</Text>
        <Text style={styles.previewBody}>{generated.body}</Text>

        <Pressable
          style={styles.button}
          onPress={() => {
            const subject = encodeURIComponent(generated.subject);
            const body = encodeURIComponent(generated.body);
            void Linking.openURL(`mailto:${activeLead.email}?subject=${subject}&body=${body}`);
          }}
        >
          <Text style={styles.buttonText}>Open in Email App</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Channel Connections</Text>
        <Field
          label="Your email"
          value={channels.yourEmail}
          onChangeText={(yourEmail) => setChannels((prev) => ({ ...prev, yourEmail }))}
        />
        <Field
          label="Website URL"
          value={channels.websiteUrl}
          onChangeText={(websiteUrl) => setChannels((prev) => ({ ...prev, websiteUrl }))}
        />
        <Field
          label="LinkedIn URL"
          value={channels.linkedinUrl}
          onChangeText={(linkedinUrl) => setChannels((prev) => ({ ...prev, linkedinUrl }))}
        />
        <Field
          label="Instagram URL"
          value={channels.instagramUrl}
          onChangeText={(instagramUrl) => setChannels((prev) => ({ ...prev, instagramUrl }))}
        />
        <Field
          label="Facebook URL"
          value={channels.facebookUrl}
          onChangeText={(facebookUrl) => setChannels((prev) => ({ ...prev, facebookUrl }))}
        />

        <View style={styles.linksRow}>
          <QuickLink label="Website" url={channels.websiteUrl} />
          <QuickLink label="LinkedIn" url={channels.linkedinUrl} />
          <QuickLink label="Instagram" url={channels.instagramUrl} />
          <QuickLink label="Facebook" url={channels.facebookUrl} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Weekly Free Marketing Execution Plan</Text>
        {weekPlan.map((item) => (
          <Text key={item} style={styles.planItem}>• {item}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#64748B"
      />
    </View>
  );
}

function QuickLink({ label, url }: { label: string; url: string }) {
  return (
    <Pressable style={styles.quickLink} onPress={() => void Linking.openURL(url)}>
      <Text style={styles.quickLinkText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    padding: 18,
    gap: 14,
    paddingBottom: 40,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 29,
    fontWeight: '800',
    marginTop: 12,
  },
  subtitle: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
  helper: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metric: {
    flex: 1,
    backgroundColor: '#0B1220',
    borderRadius: 10,
    padding: 10,
  },
  metricValue: {
    color: '#22D3EE',
    fontSize: 22,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#94A3B8',
    marginTop: 4,
    fontSize: 12,
  },
  leadItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  activeLeadItem: {
    borderColor: '#22D3EE',
    backgroundColor: '#0B2130',
  },
  leadName: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  leadMeta: {
    color: '#94A3B8',
    marginTop: 2,
    fontSize: 12,
  },
  badgeWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stageBadge: {
    color: '#F8FAFC',
    fontSize: 11,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  score: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: '#93C5FD',
    fontWeight: '600',
    fontSize: 12,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#020617',
  },
  previewLabel: {
    color: '#60A5FA',
    fontSize: 12,
    fontWeight: '700',
  },
  previewValue: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  previewBody: {
    color: '#E2E8F0',
    fontSize: 13,
    lineHeight: 19,
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
  },
  button: {
    backgroundColor: '#0EA5E9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  quickLink: {
    backgroundColor: '#1D4ED8',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  quickLinkText: {
    color: '#EFF6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  planItem: {
    color: '#CBD5E1',
    lineHeight: 20,
    fontSize: 13,
  },
});
