package com.se.jcb_mng;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@SpringBootApplication
@EnableMethodSecurity
public class JcbMngApplication {

	public static void main(String[] args) {
		SpringApplication.run(JcbMngApplication.class, args);
	}

}
