import { supabase } from '@/lib/supabase';

const unwrapApplication = (row) => ({
  ...row,
  role: row?.volunteer_roles || null,
  role_title: row?.volunteer_roles?.title || 'Volunteer role',
  role_slug: row?.volunteer_roles?.slug || null,
  role_questions: Array.isArray(row?.volunteer_roles?.questions)
    ? row.volunteer_roles.questions
    : [],
});

const invokeFunction = async (name, body) => {
  const { data, error } = await supabase.functions.invoke(name, { body });

  if (error) {
    let message = error.message || 'Request failed.';
    let code = null;
    let extra = {};

    try {
      const payload = await error?.context?.json?.();
      if (payload?.error) message = payload.error;
      code = payload?.code || null;
      extra = payload || {};
    } catch {
      // The default Functions error message is still useful.
    }

    const wrapped = new Error(message);
    wrapped.code = code;
    Object.assign(wrapped, extra);
    throw wrapped;
  }

  if (data?.error) {
    const wrapped = new Error(data.error);
    wrapped.code = data.code || null;
    Object.assign(wrapped, data);
    throw wrapped;
  }

  return data;
};

export async function getVolunteerApplications() {
  const { data, error } = await supabase
    .from('volunteer_applications')
    .select(`
      *,
      volunteer_roles(
        id,
        title,
        slug,
        department,
        commitment,
        location,
        questions
      )
    `)
    .order('last_activity_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(unwrapApplication);
}

export async function getVolunteerApplicationDetails(applicationId) {
  const [applicationResult, activityResult, emailResult] = await Promise.all([
    supabase
      .from('volunteer_applications')
      .select(`
        *,
        volunteer_roles(
          id,
          title,
          slug,
          department,
          commitment,
          location,
          questions
        )
      `)
      .eq('id', applicationId)
      .single(),
    supabase
      .from('volunteer_application_activity')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false }),
    supabase
      .from('volunteer_application_emails')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false }),
  ]);

  if (applicationResult.error) throw applicationResult.error;
  if (activityResult.error) throw activityResult.error;
  if (emailResult.error) throw emailResult.error;

  return {
    application: unwrapApplication(applicationResult.data),
    activity: activityResult.data || [],
    emails: emailResult.data || [],
  };
}

export async function transitionVolunteerApplication({
  applicationId,
  status,
  note = null,
  actorLabel = null,
}) {
  const { data, error } = await supabase.rpc('transition_volunteer_application', {
    p_application_id: applicationId,
    p_status: status,
    p_note: note,
    p_actor_label: actorLabel,
  });

  if (error) throw error;
  return data;
}


export async function getVolunteerReviewers() {
  const { data, error } = await supabase.rpc('list_volunteer_reviewers');
  if (error) throw error;
  return data || [];
}

export async function setVolunteerApplicationAssignee({
  applicationId,
  assigneeId = null,
  actorLabel = null,
}) {
  const { data, error } = await supabase.rpc('set_volunteer_application_assignee', {
    p_application_id: applicationId,
    p_assignee_id: assigneeId || null,
    p_actor_label: actorLabel,
  });

  if (error) throw error;
  return data;
}

export async function assignVolunteerApplication({
  applicationId,
  assignToSelf,
  actorLabel = null,
}) {
  const { data, error } = await supabase.rpc('assign_volunteer_application', {
    p_application_id: applicationId,
    p_assign_to_self: Boolean(assignToSelf),
    p_actor_label: actorLabel,
  });

  if (error) throw error;
  return data;
}

export async function addVolunteerApplicationNote({
  applicationId,
  note,
  actorLabel = null,
}) {
  const { data, error } = await supabase.rpc('add_volunteer_application_note', {
    p_application_id: applicationId,
    p_note: note,
    p_actor_label: actorLabel,
  });

  if (error) throw error;
  return data;
}

export async function saveVolunteerApplicationDetails({
  applicationId,
  interviewAt = null,
  interviewTimezone = 'Africa/Nairobi',
  interviewDurationMinutes = 30,
  interviewLocation = null,
  interviewNotes = null,
  decisionNotes = null,
  actorLabel = null,
}) {
  const { data, error } = await supabase.rpc('save_volunteer_application_details', {
    p_application_id: applicationId,
    p_interview_at: interviewAt || null,
    p_interview_timezone: interviewTimezone || 'Africa/Nairobi',
    p_interview_duration_minutes: Number(interviewDurationMinutes || 30),
    p_interview_location: interviewLocation || null,
    p_interview_notes: interviewNotes || null,
    p_decision_notes: decisionNotes || null,
    p_actor_label: actorLabel,
  });

  if (error) throw error;
  return data;
}

export const previewVolunteerApplicationEmail = (payload) =>
  invokeFunction('volunteer-application-email', {
    ...payload,
    preview: true,
  });

export const sendVolunteerApplicationEmail = (payload) =>
  invokeFunction('volunteer-application-email', {
    ...payload,
    preview: false,
  });
