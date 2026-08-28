(() => {
  "use strict";

  const client = window.getRuralSupabase();
  const roleLabels = { owner: "Dono", vaqueiro: "Vaqueiro", caseiro: "Caseiro" };
  const inviteForm = document.querySelector("#invite-form");
  const memberList = document.querySelector("#member-list");
  const feedback = document.querySelector("#team-feedback");
  const inviteResult = document.querySelector("#invite-result");
  const inviteCode = document.querySelector("#invite-code");
  let currentUser;
  let currentFarmId;

  function initials(name) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function setFeedback(message, error = false) {
    feedback.textContent = message;
    feedback.style.color = error ? "var(--danger)" : "var(--green-700)";
  }

  async function loadMembers() {
    const { data, error } = await client
      .from("farm_members")
      .select("user_id, role, status, created_at, profiles(full_name)")
      .eq("farm_id", currentFarmId)
      .eq("status", "active")
      .order("created_at");
    if (error) throw error;

    memberList.innerHTML = "";
    data.forEach((member) => {
      const name = member.profiles?.full_name || "Usuário";
      const row = document.createElement("article");
      row.className = "member-row";
      row.innerHTML = `
        <div><strong></strong><small></small></div>
        <select aria-label="Cargo de ${name}" ${member.role === "owner" ? "disabled" : ""}>
          ${member.role === "owner" ? '<option value="owner">Dono</option>' : '<option value="vaqueiro">Vaqueiro</option><option value="caseiro">Caseiro</option>'}
        </select>
        ${member.role === "owner" ? "" : '<button class="member-remove" type="button">Remover</button>'}
      `;
      row.querySelector("strong").textContent = name;
      row.querySelector("small").textContent = member.role === "owner" ? "Responsável pela propriedade" : "Acesso ativo";
      const select = row.querySelector("select");
      select.value = member.role;
      select.addEventListener("change", async () => {
        const { error: updateError } = await client.from("farm_members").update({ role: select.value }).eq("farm_id", currentFarmId).eq("user_id", member.user_id);
        if (updateError) { select.value = member.role; setFeedback(updateError.message, true); return; }
        member.role = select.value;
        setFeedback(`Cargo de ${name} alterado para ${roleLabels[member.role]}.`);
      });
      row.querySelector(".member-remove")?.addEventListener("click", async () => {
        if (!confirm(`Remover o acesso de ${name}?`)) return;
        const { error: deleteError } = await client.from("farm_members").delete().eq("farm_id", currentFarmId).eq("user_id", member.user_id);
        if (deleteError) { setFeedback(deleteError.message, true); return; }
        setFeedback(`${name} foi removido da propriedade.`);
        await loadMembers();
      });
      memberList.append(row);
    });
  }

  inviteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = inviteForm.querySelector("button");
    button.disabled = true;
    try {
      const { data, error } = await client.rpc("create_farm_invite", {
        p_role: inviteForm.elements.role.value,
        p_invited_email: inviteForm.elements.email.value.trim() || null,
      });
      if (error) throw error;
      inviteCode.textContent = data[0].invite_code;
      inviteResult.hidden = false;
      setFeedback("Convite criado com segurança.");
    } catch (error) {
      setFeedback(error.message, true);
    } finally {
      button.disabled = false;
    }
  });

  document.querySelector("#copy-invite").addEventListener("click", async () => {
    await navigator.clipboard.writeText(inviteCode.textContent);
    setFeedback("Código copiado.");
  });

  document.querySelector("#team-logout").addEventListener("click", async () => {
    await client.auth.signOut();
    location.replace("login.html#entrar");
  });

  (async () => {
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) { location.replace("login.html#entrar"); return; }
    currentUser = sessionData.session.user;
    const { data: membership, error } = await client.from("farm_members").select("farm_id, role").eq("user_id", currentUser.id).eq("status", "active").maybeSingle();
    if (error || membership?.role !== "owner") { location.replace("painel.html"); return; }
    currentFarmId = membership.farm_id;
    const { data: profile } = await client.from("profiles").select("full_name").eq("user_id", currentUser.id).maybeSingle();
    const name = profile?.full_name || currentUser.email;
    document.querySelector("#team-owner-name").textContent = name;
    document.querySelector("#team-initials").textContent = initials(name);
    await loadMembers();
    document.body.classList.remove("auth-checking");
  })().catch((error) => setFeedback(error.message, true));
})();

