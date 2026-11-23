package br.edu.textoemdados.auth;

import br.edu.textoemdados.config.AppProperties;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
    private final JavaMailSender sender;
    private final AppProperties properties;

    public MailService(JavaMailSender sender, AppProperties properties) {
        this.sender = sender;
        this.properties = properties;
    }

    public void sendVerification(String email, String token) {
        send(email, "Confirme seu e-mail — Texto em Dados", "/verificar-email?token=" + encode(token),
                "Confirme seu endereço para ativar a conta. Se você não criou uma conta, ignore esta mensagem.");
    }

    public void sendPasswordReset(String email, String token) {
        send(email, "Redefina sua senha — Texto em Dados", "/redefinir-senha?token=" + encode(token),
                "Use o link para redefinir a senha. Se você não solicitou a alteração, ignore esta mensagem.");
    }

    private void send(String email, String subject, String path, String introduction) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(properties.mailFrom());
        message.setTo(email);
        message.setSubject(subject);
        message.setText(introduction + "\n\n" + properties.frontendUrl() + path + "\n\nO link é de uso único e expira em 30 minutos.");
        sender.send(message);
    }

    private String encode(String token) { return URLEncoder.encode(token, StandardCharsets.UTF_8); }
}
